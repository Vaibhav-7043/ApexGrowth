import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.app.models.merchant import Merchant
from backend.app.models.customer import Customer
from backend.app.services.policy_service import PolicyService
from datetime import datetime, timedelta

@pytest.mark.asyncio
async def test_policy_engine_valid_strategy(seeded_db: AsyncSession):
    merchant = (await seeded_db.execute(select(Merchant))).scalar_one_or_none()
    assert merchant is not None
    
    # Valid proposal within bounds: 15% discount, 42 audience, INR 6,412.50 cost, 72 hours
    result = await PolicyService.validate_strategy(
        db=seeded_db,
        merchant_id=merchant.id,
        action_type="razorpay_payment_link_incentive",
        target_segment="at_risk_high_value",
        target_customer_count=42,
        discount_percent=15.0,
        estimated_campaign_cost=6412.50,
        validity_hours=72
    )
    
    assert result.passed is True
    assert len(result.violations) == 0
    assert result.checks["max_discount_limit"] is True
    assert result.checks["max_audience_limit"] is True
    assert result.checks["max_budget_limit"] is True
    assert result.checks["customer_cooldown_passed"] is True
    assert result.requires_manual_approval is True # Cost exceeds 5k threshold

@pytest.mark.asyncio
async def test_policy_engine_excessive_discount(seeded_db: AsyncSession):
    merchant = (await seeded_db.execute(select(Merchant))).scalar_one_or_none()
    assert merchant is not None
    
    # Excessive 35% discount (limit is 20%)
    result = await PolicyService.validate_strategy(
        db=seeded_db,
        merchant_id=merchant.id,
        action_type="razorpay_payment_link_incentive",
        target_segment="at_risk_high_value",
        target_customer_count=42,
        discount_percent=35.0,
        estimated_campaign_cost=15000.0,
        validity_hours=72
    )
    
    assert result.passed is False
    assert result.checks["max_discount_limit"] is False
    assert any("exceeds policy maximum limit of 20" in v for v in result.violations)

@pytest.mark.asyncio
async def test_policy_engine_excessive_audience_and_budget(seeded_db: AsyncSession):
    merchant = (await seeded_db.execute(select(Merchant))).scalar_one_or_none()
    assert merchant is not None
    
    # Audience 800 (limit 500), Budget 90,000 (limit 50,000)
    result = await PolicyService.validate_strategy(
        db=seeded_db,
        merchant_id=merchant.id,
        action_type="razorpay_payment_link_incentive",
        target_segment="at_risk_high_value",
        target_customer_count=800,
        discount_percent=15.0,
        estimated_campaign_cost=90000.0,
        validity_hours=72
    )
    
    assert result.passed is False
    assert result.checks["max_audience_limit"] is False
    assert result.checks["max_budget_limit"] is False
    assert len(result.violations) == 2

@pytest.mark.asyncio
async def test_policy_engine_cooldown_violation(seeded_db: AsyncSession):
    merchant = (await seeded_db.execute(select(Merchant))).scalar_one_or_none()
    assert merchant is not None
    
    # Simulate a customer in the at_risk_high_value segment having received an incentive 3 days ago
    cust_stmt = select(Customer).where(Customer.rfm_segment == "at_risk_high_value").limit(1)
    customer = (await seeded_db.execute(cust_stmt)).scalar_one_or_none()
    assert customer is not None
    customer.last_incentive_sent_at = datetime.utcnow() - timedelta(days=3)
    await seeded_db.commit()
    
    result = await PolicyService.validate_strategy(
        db=seeded_db,
        merchant_id=merchant.id,
        action_type="razorpay_payment_link_incentive",
        target_segment="at_risk_high_value",
        target_customer_count=42,
        discount_percent=15.0,
        estimated_campaign_cost=6412.50,
        validity_hours=72
    )
    
    assert result.passed is False
    assert result.checks["customer_cooldown_passed"] is False
    assert any("cooldown period" in v for v in result.violations)

@pytest.mark.asyncio
async def test_policy_engine_invalid_action_type(seeded_db: AsyncSession):
    merchant = (await seeded_db.execute(select(Merchant))).scalar_one_or_none()
    assert merchant is not None
    
    result = await PolicyService.validate_strategy(
        db=seeded_db,
        merchant_id=merchant.id,
        action_type="arbitrary_unauthorized_payment_transfer",
        target_segment="at_risk_high_value",
        target_customer_count=42,
        discount_percent=10.0,
        estimated_campaign_cost=2000.0,
        validity_hours=48
    )
    
    assert result.passed is False
    assert result.checks["allowed_action_type"] is False
