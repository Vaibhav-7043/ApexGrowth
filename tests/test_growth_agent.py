import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.app.models.merchant import Merchant
from backend.app.models.opportunity import Opportunity
from backend.app.models.strategy import Strategy
from backend.app.models.approval import ApprovalRequest
from backend.app.tools.agent_tools import AgentTools
from backend.app.agents.growth_agent import GrowthAgent

@pytest.mark.asyncio
async def test_deterministic_agent_financial_calculations():
    # Test that the mathematical projection is 100% deterministic and never hallucinated
    calc = AgentTools.calculate_strategy_financials(
        customer_count=40,
        average_aov=2500.0,
        discount_percent=10.0,
        expected_conversion_rate=0.35
    )
    
    # 40 * 0.35 = 14 expected orders
    # 14 * 2500.0 = 35000.0 gross revenue
    # 35000.0 * 0.10 = 3500.0 campaign cost
    # 35000.0 - 3500.0 = 31500.0 net lift
    # 35000.0 / 3500.0 = 10.0x ROI
    assert calc["expected_orders"] == 14
    assert calc["estimated_gross_revenue"] == 35000.0
    assert calc["estimated_campaign_cost"] == 3500.0
    assert calc["estimated_net_lift"] == 31500.0
    assert calc["projected_roi"] == 10.0

@pytest.mark.asyncio
async def test_growth_agent_analyze_and_propose(seeded_db: AsyncSession):
    merchant = (await seeded_db.execute(select(Merchant))).scalar_one_or_none()
    assert merchant is not None
    
    # Run the Growth Agent reasoning loop
    result = await GrowthAgent.analyze_and_propose_strategy(
        db=seeded_db,
        merchant_id=merchant.id,
        custom_discount_override=15.0
    )
    
    assert "opportunity" in result
    assert "strategy" in result
    assert "approval_request" in result
    assert "policy_validation" in result
    
    strat: Strategy = result["strategy"]
    app_req: ApprovalRequest = result["approval_request"]
    
    # Assert structured strategy properties
    assert strat.proposed_discount_percent == 15.0
    assert strat.target_audience_count == 42
    assert strat.estimated_gross_revenue > 0
    assert strat.estimated_campaign_cost > 0
    assert strat.estimated_net_lift > 0
    assert strat.projected_roi > 0
    
    # Assert grounded WHY explanation structure and facts
    why = strat.why_explanation
    assert "core_insight" in why
    assert "data_evidence" in why
    assert "financial_breakdown" in why
    assert "selection_rationale" in why
    assert why["grounded_in_db"] is True
    assert why["data_evidence"]["target_cohort_size"] == 42
    assert why["data_evidence"]["historical_spend_inr"] > 0
    
    # Assert Approval State
    assert app_req.status == "pending_approval"
    assert app_req.policy_checks_passed is True
