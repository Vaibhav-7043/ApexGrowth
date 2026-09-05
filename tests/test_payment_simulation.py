import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.app.models.merchant import Merchant
from backend.app.models.campaign import Campaign
from backend.app.models.campaign_action import CampaignAction
from backend.app.models.order import Order
from backend.app.models.payment import Payment
from backend.app.agents.growth_agent import GrowthAgent
from backend.app.services.approval_service import ApprovalStateMachine
from backend.app.services.campaign_service import CampaignExecutionEngine
from backend.app.services.attribution_service import AttributionService
from backend.app.services.audit_service import AuditService

@pytest.mark.asyncio
async def test_payment_simulation_success_and_failure(seeded_db: AsyncSession):
    merchant = (await seeded_db.execute(select(Merchant))).scalar_one_or_none()
    assert merchant is not None
    
    # 1. Propose, approve, and execute campaign
    result = await GrowthAgent.analyze_and_propose_strategy(db=seeded_db, merchant_id=merchant.id, custom_discount_override=15.0)
    approval = result["approval_request"]
    await ApprovalStateMachine.decide_approval(db=seeded_db, approval_id=approval.id, approved=True)
    campaign = await CampaignExecutionEngine.execute_approved_campaign(db=seeded_db, approval_request_id=approval.id)
    
    # Get 3 actions for testing
    actions = (await seeded_db.execute(select(CampaignAction).where(CampaignAction.campaign_id == campaign.id))).scalars().all()
    action_1 = actions[0]
    action_2 = actions[1]
    action_3 = actions[2]
    
    # 2. Simulate SUCCESS on action 1
    res1 = await AttributionService.process_payment_success(
        db=seeded_db,
        razorpay_payment_link_id=action_1.razorpay_payment_link_id,
        payment_id="pay_test_succ_001",
        amount_paid_inr=action_1.final_amount,
        payment_method="upi"
    )
    assert res1["status"] == "success"
    assert res1["attributed_revenue"] == action_1.final_amount
    
    await seeded_db.refresh(action_1)
    assert action_1.status == "paid"
    assert action_1.paid_at is not None
    
    # Verify Order and Payment created
    order = (await seeded_db.execute(select(Order).where(Order.campaign_id == campaign.id))).scalar_one_or_none()
    assert order is not None
    assert order.final_amount == action_1.final_amount
    
    # 3. Simulate FAILURE on action 2
    res2 = await AttributionService.process_payment_failure(
        db=seeded_db,
        razorpay_payment_link_id=action_2.razorpay_payment_link_id,
        error_code="INSUFFICIENT_FUNDS",
        error_description="Customer account balance insufficient."
    )
    assert res2["status"] == "failed"
    await seeded_db.refresh(action_2)
    assert action_2.status == "failed"
    assert "INSUFFICIENT_FUNDS" in action_2.failure_reason
    
    # 4. Simulate EXPIRED on action 3
    res3 = await AttributionService.process_payment_expired(
        db=seeded_db,
        razorpay_payment_link_id=action_3.razorpay_payment_link_id
    )
    assert res3["status"] == "expired"
    await seeded_db.refresh(action_3)
    assert action_3.status == "expired"
    
    # 5. Check campaign updated metrics
    await seeded_db.refresh(campaign)
    assert campaign.conversions_count == 1
    assert campaign.actual_revenue_generated == action_1.final_amount
    assert campaign.actual_incentive_spent == action_1.discount_amount
    assert campaign.net_revenue_lift == round(action_1.final_amount - action_1.discount_amount, 2)
    assert campaign.realized_roi > 0
    
    # Verify audit chain integrity
    verification = await AuditService.verify_chain(seeded_db, merchant.id)
    assert verification.is_valid is True
