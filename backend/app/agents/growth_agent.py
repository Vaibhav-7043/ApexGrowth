import uuid
from datetime import datetime
from typing import Dict, Any, Optional
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.models.opportunity import Opportunity
from backend.app.models.strategy import Strategy
from backend.app.models.approval import ApprovalRequest
from backend.app.models.enums import OpportunityType, OpportunityStatus, ApprovalStatus, ActorType
from backend.app.tools.agent_tools import AgentTools
from backend.app.services.policy_service import PolicyService
from backend.app.services.audit_service import AuditService
from backend.app.agents.llm_client import get_llm_client

class GrowthAgent:
    @staticmethod
    async def analyze_and_propose_strategy(
        db: AsyncSession,
        merchant_id: str,
        opportunity_id: Optional[str] = None,
        custom_discount_override: Optional[float] = None,
        custom_audience_override: Optional[int] = None
    ) -> Dict[str, Any]:
        # 1. Fetch or identify prime opportunity
        if opportunity_id:
            opp_stmt = (
                select(Opportunity)
                .options(selectinload(Opportunity.strategy))
                .where(and_(Opportunity.id == opportunity_id, Opportunity.merchant_id == merchant_id))
            )
            opp = (await db.execute(opp_stmt)).scalar_one_or_none()
        else:
            opp_stmt = (
                select(Opportunity)
                .options(selectinload(Opportunity.strategy))
                .where(and_(Opportunity.merchant_id == merchant_id, Opportunity.status == OpportunityStatus.DISCOVERED.value))
                .order_by(Opportunity.estimated_recoverable_revenue.desc())
                .limit(1)
            )
            opp = (await db.execute(opp_stmt)).scalar_one_or_none()
            
        if not opp:
            raise ValueError("No active growth opportunity found for merchant.")
            
        # 2. Use Deterministic Tools to retrieve grounded data & calculations
        segment_details = await AgentTools.get_segment_details(db, merchant_id, opp.target_segment)
        
        target_audience = custom_audience_override if custom_audience_override is not None else opp.target_customer_count
        discount_to_use = custom_discount_override if custom_discount_override is not None else 15.0
        
        financials = AgentTools.calculate_strategy_financials(
            customer_count=target_audience,
            average_aov=opp.average_customer_aov,
            discount_percent=discount_to_use,
            expected_conversion_rate=0.35
        )
        
        # 3. Assemble structured context for LLM reasoning
        context = {
            "opportunity_id": opp.id,
            "opportunity_type": opp.type,
            "target_segment": opp.target_segment,
            "target_customer_count": target_audience,
            "total_historical_spend": opp.total_historical_spend,
            "average_customer_aov": opp.average_customer_aov,
            "average_days_inactive": segment_details.get("average_days_inactive", 60.0),
            "sample_cohort": segment_details.get("sample_cohort", []),
            "financials": financials
        }
        
        # 4. Invoke LLM Provider (or deterministic fallback)
        llm = get_llm_client()
        raw_proposal = await llm.generate_strategy_reasoning(context)
        
        # 5. Deterministic Policy Validation (LLM cannot bypass)
        policy_result = await PolicyService.validate_strategy(
            db=db,
            merchant_id=merchant_id,
            action_type=raw_proposal.get("action_type", "razorpay_payment_link_incentive"),
            target_segment=opp.target_segment,
            target_customer_count=target_audience,
            discount_percent=discount_to_use,
            estimated_campaign_cost=financials["estimated_campaign_cost"],
            validity_hours=raw_proposal.get("validity_hours", 72)
        )
        
        # 6. Persist Strategy in DB
        strategy_id = str(uuid.uuid4())
        existing_strat_stmt = select(Strategy).where(Strategy.opportunity_id == opp.id)
        existing_strat = (await db.execute(existing_strat_stmt)).scalar_one_or_none()
        
        if existing_strat:
            strategy = existing_strat
            strategy.name = raw_proposal["strategy_name"]
            strategy.action_type = raw_proposal["action_type"]
            strategy.proposed_discount_percent = discount_to_use
            strategy.validity_hours = raw_proposal.get("validity_hours", 72)
            strategy.min_order_amount = raw_proposal.get("min_order_amount", round(opp.average_customer_aov * 0.75, 2))
            strategy.target_audience_count = target_audience
            strategy.estimated_campaign_cost = financials["estimated_campaign_cost"]
            strategy.estimated_gross_revenue = financials["estimated_gross_revenue"]
            strategy.estimated_net_lift = financials["estimated_net_lift"]
            strategy.projected_roi = financials["projected_roi"]
            strategy.why_explanation = raw_proposal["why_explanation"]
        else:
            strategy = Strategy(
                id=strategy_id,
                opportunity_id=opp.id,
                name=raw_proposal["strategy_name"],
                action_type=raw_proposal["action_type"],
                proposed_discount_percent=discount_to_use,
                validity_hours=raw_proposal.get("validity_hours", 72),
                min_order_amount=raw_proposal.get("min_order_amount", round(opp.average_customer_aov * 0.75, 2)),
                target_audience_count=target_audience,
                estimated_campaign_cost=financials["estimated_campaign_cost"],
                estimated_gross_revenue=financials["estimated_gross_revenue"],
                estimated_net_lift=financials["estimated_net_lift"],
                projected_roi=financials["projected_roi"],
                why_explanation=raw_proposal["why_explanation"]
            )
            db.add(strategy)
            
        await db.flush()
        
        # 7. Create or Update Gated Approval Request with State Machine
        initial_approval_status = ApprovalStatus.PENDING_APPROVAL.value if policy_result.passed else ApprovalStatus.POLICY_BLOCKED.value
        
        existing_app_stmt = select(ApprovalRequest).where(ApprovalRequest.strategy_id == strategy.id)
        existing_app = (await db.execute(existing_app_stmt)).scalar_one_or_none()
        
        if existing_app:
            approval = existing_app
            approval.status = initial_approval_status
            approval.policy_checks_passed = policy_result.passed
            approval.policy_validation_report = policy_result.to_dict()
        else:
            approval = ApprovalRequest(
                id=str(uuid.uuid4()),
                strategy_id=strategy.id,
                status=initial_approval_status,
                policy_checks_passed=policy_result.passed,
                policy_validation_report=policy_result.to_dict()
            )
            db.add(approval)
            
        opp.status = OpportunityStatus.STRATEGY_GENERATED.value
        await db.commit()
        
        # Re-fetch opp and strategy with selectinload to ensure clean async serialization
        opp_refreshed = (
            await db.execute(
                select(Opportunity)
                .options(selectinload(Opportunity.strategy).selectinload(Strategy.approval_request))
                .where(Opportunity.id == opp.id)
            )
        ).scalar_one()
        
        strategy_refreshed = (
            await db.execute(
                select(Strategy)
                .options(selectinload(Strategy.approval_request))
                .where(Strategy.id == strategy.id)
            )
        ).scalar_one()
        await db.refresh(approval)
        
        # 8. Record Immutable Hash-Chained Audit Trail
        await AuditService.log_event(
            db=db,
            merchant_id=merchant_id,
            actor_type=ActorType.AGENT.value,
            actor_id="growth_agent_v1",
            action="STRATEGY_GENERATED",
            target_type="strategy",
            target_id=strategy.id,
            summary=f"Agent proposed strategy: {strategy.name} ({strategy.proposed_discount_percent}% discount, ROI {strategy.projected_roi}x)",
            details={
                "strategy_id": strategy.id,
                "opportunity_id": opp.id,
                "financials": financials,
                "action_type": strategy.action_type
            },
            policy_passed=policy_result.passed
        )
        
        if not policy_result.passed:
            await AuditService.log_event(
                db=db,
                merchant_id=merchant_id,
                actor_type=ActorType.POLICY_ENGINE.value,
                actor_id="policy_engine_v1",
                action="POLICY_VIOLATION_BLOCKED",
                target_type="strategy",
                target_id=strategy.id,
                summary=f"Policy engine blocked strategy: {len(policy_result.violations)} violation(s)",
                details={"violations": policy_result.violations, "checks": policy_result.checks},
                policy_passed=False
            )
        else:
            await AuditService.log_event(
                db=db,
                merchant_id=merchant_id,
                actor_type=ActorType.POLICY_ENGINE.value,
                actor_id="policy_engine_v1",
                action="POLICY_VALIDATED",
                target_type="strategy",
                target_id=strategy.id,
                summary=f"Policy validation passed for strategy {strategy.id}",
                details={"checks": policy_result.checks},
                policy_passed=True
            )
            
        return {
            "opportunity": opp_refreshed,
            "strategy": strategy_refreshed,
            "approval_request": approval,
            "policy_validation": policy_result.to_dict()
        }
