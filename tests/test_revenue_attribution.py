import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.app.models.merchant import Merchant
from backend.app.models.campaign import Campaign
from backend.app.models.campaign_action import CampaignAction
from backend.app.agents.growth_agent import GrowthAgent
from backend.app.services.approval_service import ApprovalStateMachine
from backend.app.services.campaign_service import CampaignExecutionEngine
from backend.app.services.attribution_service import AttributionService

@pytest.mark.asyncio
async def test_projected_vs_actual_metrics_distinction(seeded_db: AsyncSession):
    merchant = (await seeded_db.execute(select(Merchant))).scalar_one_or_none()
    assert merchant is not None
    
    # 1. Propose strategy
    result = await GrowthAgent.analyze_and_propose_strategy(
        db=seeded_db,
        merchant_id=merchant.id,
        custom_discount_override=15.0
    )
    strategy = result["strategy"]
    approval = result["approval_request"]
    
    # Check projected values are recorded on Strategy
    assert strategy.estimated_gross_revenue > 0
    assert strategy.estimated_campaign_cost > 0
    assert strategy.estimated_net_lift > 0
    assert strategy.projected_roi > 0
    proj_gross = strategy.estimated_gross_revenue
    
    # 2. Approve and Execute
    await ApprovalStateMachine.decide_approval(db=seeded_db, approval_id=approval.id, approved=True)
    campaign = await CampaignExecutionEngine.execute_approved_campaign(db=seeded_db, approval_request_id=approval.id)
    
    # Before conversions, actual metrics are zero
    assert campaign.actual_revenue_generated == 0.0
    assert campaign.actual_incentive_spent == 0.0
    assert campaign.conversions_count == 0
    
    # 3. Simulate 5 successful customer payments
    actions = (await seeded_db.execute(select(CampaignAction).where(CampaignAction.campaign_id == campaign.id))).scalars().all()
    sample_5_actions = actions[:5]
    
    expected_actual_revenue = sum(a.final_amount for a in sample_5_actions)
    expected_actual_cost = sum(a.discount_amount for a in sample_5_actions)
    expected_actual_lift = round(expected_actual_revenue - expected_actual_cost, 2)
    expected_actual_roi = round(expected_actual_revenue / expected_actual_cost, 2)
    
    for idx, act in enumerate(sample_5_actions):
        await AttributionService.process_payment_success(
            db=seeded_db,
            razorpay_payment_link_id=act.razorpay_payment_link_id,
            payment_id=f'pay_sim_attr_{idx}',
            amount_paid_inr=act.final_amount,
            payment_method='upi'
        )
        
    await seeded_db.refresh(campaign)
    await seeded_db.refresh(strategy)
    
    # Assert actual metrics match the exact deterministic calculation
    assert campaign.conversions_count == 5
    assert campaign.actual_revenue_generated == round(expected_actual_revenue, 2)
    assert campaign.actual_incentive_spent == round(expected_actual_cost, 2)
    assert campaign.net_revenue_lift == expected_actual_lift
    assert campaign.realized_roi == expected_actual_roi
    
    # Assert Projected metrics on Strategy were NOT overwritten
    assert strategy.estimated_gross_revenue == proj_gross
