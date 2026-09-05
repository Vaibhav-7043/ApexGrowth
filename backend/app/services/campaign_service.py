import uuid
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.models.approval import ApprovalRequest
from backend.app.models.strategy import Strategy
from backend.app.models.opportunity import Opportunity
from backend.app.models.campaign import Campaign
from backend.app.models.campaign_action import CampaignAction
from backend.app.models.customer import Customer
from backend.app.models.enums import ApprovalStatus, CampaignStatus, CampaignActionStatus, ActorType
from backend.app.services.policy_service import PolicyService
from backend.app.services.razorpay_service import RazorpayService
from backend.app.services.audit_service import AuditService

class CampaignExecutionEngine:
    @staticmethod
    async def execute_approved_campaign(
        db: AsyncSession,
        approval_request_id: str,
        idempotency_key: Optional[str] = None
    ) -> Campaign:
        # 1. Idempotency Check: Return existing campaign if already created for this key or approval
        if idempotency_key:
            existing_by_key = (
                await db.execute(select(Campaign).where(Campaign.idempotency_key == idempotency_key))
            ).scalar_one_or_none()
            if existing_by_key:
                return existing_by_key
                
        existing_camp = (
            await db.execute(select(Campaign).where(Campaign.approval_request_id == approval_request_id))
        ).scalar_one_or_none()
        if existing_camp:
            return existing_camp

        # 2. Fetch and validate approval request
        stmt = (
            select(ApprovalRequest)
            .options(selectinload(ApprovalRequest.strategy))
            .where(ApprovalRequest.id == approval_request_id)
        )
        result = await db.execute(stmt)
        approval = result.scalar_one_or_none()
        
        if not approval:
            raise ValueError(f"Approval request {approval_request_id} not found.")
            
        if approval.status != ApprovalStatus.APPROVED.value:
            raise ValueError(f"Cannot execute campaign: Approval status is '{approval.status}', expected '{ApprovalStatus.APPROVED.value}'.")
            
        strategy = approval.strategy
        if not strategy:
            raise ValueError("Strategy record missing for approval request.")
            
        opp_stmt = select(Opportunity).where(Opportunity.id == strategy.opportunity_id)
        opportunity = (await db.execute(opp_stmt)).scalar_one()
        merchant_id = opportunity.merchant_id
            
        # 3. CRITICAL: Revalidate Policy immediately prior to execution
        policy_result = await PolicyService.validate_strategy(
            db=db,
            merchant_id=merchant_id,
            action_type=strategy.action_type,
            target_segment=opportunity.target_segment,
            target_customer_count=strategy.target_audience_count,
            discount_percent=strategy.proposed_discount_percent,
            estimated_campaign_cost=strategy.estimated_campaign_cost,
            validity_hours=strategy.validity_hours
        )
        
        if not policy_result.passed:
            approval.status = ApprovalStatus.POLICY_BLOCKED.value
            await db.commit()
            
            await AuditService.log_event(
                db=db,
                merchant_id=merchant_id,
                actor_type=ActorType.POLICY_ENGINE.value,
                actor_id="execution_guard",
                action="EXECUTION_POLICY_REVALIDATION_FAILED",
                target_type="approval_request",
                target_id=approval.id,
                summary=f"Campaign execution blocked by policy revalidation: {policy_result.violations[0]}",
                details={"violations": policy_result.violations, "checks": policy_result.checks},
                policy_passed=False
            )
            raise ValueError(f"Execution halted: Policy revalidation failed: {', '.join(policy_result.violations)}")
            
        # 4. Fetch target customers
        cust_stmt = (
            select(Customer)
            .where(
                and_(
                    Customer.merchant_id == merchant_id,
                    Customer.rfm_segment == opportunity.target_segment
                )
            )
            .limit(strategy.target_audience_count)
        )
        customers = (await db.execute(cust_stmt)).scalars().all()
        if not customers:
            raise ValueError(f"No customers found in target segment: {opportunity.target_segment}")
            
        # 5. Initialize Campaign
        execution_mode = RazorpayService.get_mode()
        campaign = Campaign(
            id=str(uuid.uuid4()),
            merchant_id=merchant_id,
            approval_request_id=approval.id,
            name=strategy.name,
            status=CampaignStatus.RUNNING.value,
            execution_mode=execution_mode,
            idempotency_key=idempotency_key or f"camp_key_{uuid.uuid4().hex[:12]}",
            target_count=len(customers),
            links_created_count=0,
            conversions_count=0,
            budget_cap=strategy.estimated_campaign_cost,
            actual_incentive_spent=0.0,
            actual_revenue_generated=0.0,
            net_revenue_lift=0.0,
            realized_roi=0.0,
            execution_details={
                "strategy_id": strategy.id,
                "target_segment": opportunity.target_segment,
                "discount_percent": strategy.proposed_discount_percent,
                "validity_hours": strategy.validity_hours,
                "min_order_amount": strategy.min_order_amount,
                "execution_mode": execution_mode
            }
        )
        db.add(campaign)
        await db.flush()
        
        # 6. Generate Razorpay / Sandbox Payment Links for each customer
        now = datetime.utcnow()
        expire_dt = now + timedelta(hours=strategy.validity_hours)
        expire_ts = int(expire_dt.timestamp())
        
        actions_created = []
        for customer in customers:
            orig_amt = customer.average_order_value if customer.average_order_value > 0 else 1500.0
            discount_amt = round(orig_amt * (strategy.proposed_discount_percent / 100.0), 2)
            final_amt = round(orig_amt - discount_amt, 2)
            
            link_res = await RazorpayService.create_payment_link(
                customer_name=customer.name,
                customer_email=customer.email,
                customer_phone=customer.phone,
                amount_inr=final_amt,
                description=f"{strategy.name} - Special {strategy.proposed_discount_percent:.0f}% Off",
                expire_by_timestamp=expire_ts
            )
            
            action = CampaignAction(
                id=str(uuid.uuid4()),
                campaign_id=campaign.id,
                customer_id=customer.id,
                razorpay_payment_link_id=link_res["id"],
                razorpay_short_url=link_res["short_url"],
                idempotency_key=f"act_{customer.id}_{campaign.id}",
                original_amount=orig_amt,
                discount_amount=discount_amt,
                final_amount=final_amt,
                status=CampaignActionStatus.SENT.value,
                created_at=now,
                executed_at=now
            )
            db.add(action)
            actions_created.append(action)
            
            # Anti-fatigue cooldown marker
            customer.last_incentive_sent_at = now
            
        campaign.links_created_count = len(actions_created)
        approval.status = ApprovalStatus.EXECUTING.value
        
        await db.commit()
        await db.refresh(campaign)
        
        # 7. Record Hash-Chained Audit Trail
        await AuditService.log_event(
            db=db,
            merchant_id=merchant_id,
            actor_type=ActorType.AGENT.value,
            actor_id="campaign_execution_engine",
            action="CAMPAIGN_EXECUTED",
            target_type="campaign",
            target_id=campaign.id,
            summary=f"Executed campaign '{campaign.name}' in {execution_mode} mode. Created {len(actions_created)} payment links.",
            details={
                "campaign_id": campaign.id,
                "approval_request_id": approval.id,
                "target_count": campaign.target_count,
                "execution_mode": execution_mode,
                "sample_link": actions_created[0].razorpay_short_url if actions_created else None
            },
            policy_passed=True
        )
        
        return campaign
