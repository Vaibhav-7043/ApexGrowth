import uuid
from datetime import datetime
from typing import Dict, Any, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.models.campaign import Campaign
from backend.app.models.campaign_action import CampaignAction
from backend.app.models.customer import Customer
from backend.app.models.order import Order
from backend.app.models.payment import Payment
from backend.app.models.enums import CampaignActionStatus, OrderStatus, PaymentStatus, ActorType
from backend.app.services.audit_service import AuditService

class AttributionService:
    @staticmethod
    async def process_payment_success(
        db: AsyncSession,
        razorpay_payment_link_id: str,
        payment_id: str,
        amount_paid_inr: float,
        payment_method: str = "upi"
    ) -> Dict[str, Any]:
        # 1. Fetch Campaign Action
        stmt = select(CampaignAction).where(CampaignAction.razorpay_payment_link_id == razorpay_payment_link_id)
        result = await db.execute(stmt)
        action = result.scalar_one_or_none()
        
        if not action:
            raise ValueError(f"No campaign action found for payment link: {razorpay_payment_link_id}")
            
        # 2. Idempotency Check: prevent duplicate revenue attribution
        if action.status == CampaignActionStatus.PAID.value:
            camp_stmt = select(Campaign).where(Campaign.id == action.campaign_id)
            camp = (await db.execute(camp_stmt)).scalar_one()
            return {
                "status": "already_processed",
                "action_id": action.id,
                "campaign_id": camp.id,
                "attributed_revenue": 0.0,
                "message": "Payment already processed and attributed. Duplicate webhook ignored."
            }
            
        # 3. Mark Action as PAID
        now = datetime.utcnow()
        action.status = CampaignActionStatus.PAID.value
        action.paid_at = now
        
        # 4. Fetch Campaign & Customer
        camp_stmt = select(Campaign).where(Campaign.id == action.campaign_id)
        campaign = (await db.execute(camp_stmt)).scalar_one()
        
        cust_stmt = select(Customer).where(Customer.id == action.customer_id)
        customer = (await db.execute(cust_stmt)).scalar_one()
        
        # 5. Create Order and Payment Records
        order = Order(
            id=str(uuid.uuid4()),
            merchant_id=campaign.merchant_id,
            customer_id=customer.id,
            order_number=f"ORD-CAMPAIGN-{uuid.uuid4().hex[:6].upper()}",
            amount=action.original_amount,
            discount_amount=action.discount_amount,
            final_amount=action.final_amount,
            currency="INR",
            status=OrderStatus.PAID.value,
            razorpay_order_id=f"order_{payment_id}",
            campaign_id=campaign.id,
            created_at=now
        )
        db.add(order)
        await db.flush()
        
        payment = Payment(
            id=str(uuid.uuid4()),
            order_id=order.id,
            razorpay_payment_id=payment_id,
            amount=action.final_amount,
            currency="INR",
            method=payment_method,
            status=PaymentStatus.CAPTURED.value,
            fee=round(action.final_amount * 0.02, 2),
            tax=round(action.final_amount * 0.02 * 0.18, 2),
            created_at=now
        )
        db.add(payment)
        
        # 6. Update Customer RFM metrics
        customer.total_spend = round(customer.total_spend + action.final_amount, 2)
        customer.order_count += 1
        customer.average_order_value = round(customer.total_spend / customer.order_count, 2)
        customer.last_order_at = now
        customer.days_since_last_order = 0
        customer.churn_risk_score = 0.20
        
        # 7. Deterministically Recalculate Campaign Actual ROI and Lift
        actions_stmt = select(CampaignAction).where(CampaignAction.campaign_id == campaign.id)
        all_actions = (await db.execute(actions_stmt)).scalars().all()
        
        paid_actions = [a for a in all_actions if a.status == CampaignActionStatus.PAID.value or a.id == action.id]
        conversions_count = len(paid_actions)
        actual_rev = sum(a.final_amount for a in paid_actions)
        actual_cost = sum(a.discount_amount for a in paid_actions)
        net_lift = actual_rev - actual_cost
        roi = round(actual_rev / actual_cost, 2) if actual_cost > 0 else 0.0
        
        campaign.conversions_count = conversions_count
        campaign.actual_revenue_generated = round(actual_rev, 2)
        campaign.actual_incentive_spent = round(actual_cost, 2)
        campaign.net_revenue_lift = round(net_lift, 2)
        campaign.realized_roi = roi
        
        await db.commit()
        await db.refresh(action)
        await db.refresh(campaign)
        
        # 8. Record Hash-Chained Audit Trail
        await AuditService.log_event(
            db=db,
            merchant_id=campaign.merchant_id,
            actor_type=ActorType.RAZORPAY_API.value if campaign.execution_mode == "razorpay_test" else ActorType.SANDBOX_SIMULATOR.value,
            actor_id="payment_webhook",
            action="PAYMENT_CAPTURED",
            target_type="campaign_action",
            target_id=action.id,
            summary=f"Payment of INR {action.final_amount:,.2f} captured via {payment_method} for customer {customer.name}",
            details={
                "payment_id": payment_id,
                "action_id": action.id,
                "customer_id": customer.id,
                "amount": action.final_amount,
                "discount": action.discount_amount
            },
            policy_passed=True
        )
        
        await AuditService.log_event(
            db=db,
            merchant_id=campaign.merchant_id,
            actor_type=ActorType.SYSTEM.value,
            actor_id="attribution_engine",
            action="REVENUE_ATTRIBUTED",
            target_type="campaign",
            target_id=campaign.id,
            summary=f"Attributed INR {action.final_amount:,.2f} to Campaign {campaign.name}. Total Lift: INR {campaign.net_revenue_lift:,.2f} (ROI: {campaign.realized_roi}x)",
            details={
                "campaign_id": campaign.id,
                "conversions_count": conversions_count,
                "actual_revenue_generated": campaign.actual_revenue_generated,
                "actual_incentive_spent": campaign.actual_incentive_spent,
                "net_revenue_lift": campaign.net_revenue_lift,
                "realized_roi": campaign.realized_roi
            },
            policy_passed=True
        )
        
        return {
            "status": "success",
            "action_id": action.id,
            "campaign_id": campaign.id,
            "payment_id": payment_id,
            "attributed_revenue": action.final_amount,
            "net_revenue_lift": campaign.net_revenue_lift,
            "realized_roi": campaign.realized_roi,
            "message": "Payment captured and revenue successfully attributed to campaign."
        }

    @staticmethod
    async def process_payment_failure(
        db: AsyncSession,
        razorpay_payment_link_id: str,
        error_code: str,
        error_description: str
    ) -> Dict[str, Any]:
        stmt = select(CampaignAction).where(CampaignAction.razorpay_payment_link_id == razorpay_payment_link_id)
        action = (await db.execute(stmt)).scalar_one_or_none()
        
        if not action:
            raise ValueError(f"No campaign action found for link: {razorpay_payment_link_id}")
            
        action.status = CampaignActionStatus.FAILED.value
        action.failure_reason = f"{error_code}: {error_description}"
        
        camp_stmt = select(Campaign).where(Campaign.id == action.campaign_id)
        campaign = (await db.execute(camp_stmt)).scalar_one()
        
        await db.commit()
        
        await AuditService.log_event(
            db=db,
            merchant_id=campaign.merchant_id,
            actor_type=ActorType.RAZORPAY_API.value if campaign.execution_mode == "razorpay_test" else ActorType.SANDBOX_SIMULATOR.value,
            actor_id="payment_webhook",
            action="PAYMENT_FAILED",
            target_type="campaign_action",
            target_id=action.id,
            summary=f"Payment failed for action {action.id}. Reason: {error_code}",
            details={"error_code": error_code, "error_description": error_description},
            policy_passed=False
        )
        
        return {
            "status": "failed",
            "action_id": action.id,
            "campaign_id": campaign.id,
            "error_code": error_code,
            "error_description": error_description,
            "message": "Payment marked as failed."
        }

    @staticmethod
    async def process_payment_expired(db: AsyncSession, razorpay_payment_link_id: str) -> Dict[str, Any]:
        stmt = select(CampaignAction).where(CampaignAction.razorpay_payment_link_id == razorpay_payment_link_id)
        action = (await db.execute(stmt)).scalar_one_or_none()
        if not action:
            raise ValueError(f"No campaign action found for link: {razorpay_payment_link_id}")
            
        action.status = CampaignActionStatus.EXPIRED.value
        action.failure_reason = "Payment link validity expired."
        
        camp_stmt = select(Campaign).where(Campaign.id == action.campaign_id)
        campaign = (await db.execute(camp_stmt)).scalar_one()
        
        await db.commit()
        
        await AuditService.log_event(
            db=db,
            merchant_id=campaign.merchant_id,
            actor_type=ActorType.SYSTEM.value,
            actor_id="payment_expiry_monitor",
            action="PAYMENT_LINK_EXPIRED",
            target_type="campaign_action",
            target_id=action.id,
            summary=f"Payment link {razorpay_payment_link_id} expired.",
            details={"action_id": action.id, "campaign_id": campaign.id},
            policy_passed=True
        )
        
        return {
            "status": "expired",
            "action_id": action.id,
            "campaign_id": campaign.id,
            "message": "Payment link expired."
        }
