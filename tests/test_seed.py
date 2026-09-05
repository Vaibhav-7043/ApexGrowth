import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.models.merchant import Merchant
from backend.app.models.customer import Customer
from backend.app.models.order import Order
from backend.app.models.payment import Payment
from backend.app.models.opportunity import Opportunity
from backend.app.models.policy_config import PolicyConfig
from backend.app.models.audit_event import AuditEvent
from backend.app.models.enums import CustomerSegment

@pytest.mark.asyncio
async def test_database_seeding(seeded_db: AsyncSession):
    merchant = (await seeded_db.execute(select(Merchant))).scalar_one_or_none()
    assert merchant is not None
    assert merchant.name == "Artisan Roasters Co."
    assert merchant.currency == "INR"
    
    policy = (await seeded_db.execute(select(PolicyConfig).where(PolicyConfig.merchant_id == merchant.id))).scalar_one_or_none()
    assert policy is not None
    assert policy.max_discount_percent == 20.0
    assert policy.max_campaign_audience == 500
    assert policy.max_budget_inr == 50000.0
    
    customers = (await seeded_db.execute(select(Customer).where(Customer.merchant_id == merchant.id))).scalars().all()
    assert len(customers) == 220
    
    at_risk = [c for c in customers if c.rfm_segment == CustomerSegment.AT_RISK_HIGH_VALUE.value]
    assert len(at_risk) == 42
    for c in at_risk:
        assert c.total_spend >= 5000.0
        assert c.days_since_last_order >= 45
        
    orders = (await seeded_db.execute(select(Order).where(Order.merchant_id == merchant.id))).scalars().all()
    assert len(orders) > 500
    
    payments = (await seeded_db.execute(select(Payment))).scalars().all()
    assert len(payments) == len(orders)
    
    opportunity = (await seeded_db.execute(select(Opportunity).where(Opportunity.merchant_id == merchant.id))).scalar_one_or_none()
    assert opportunity is not None
    assert opportunity.target_customer_count == 42
    assert opportunity.target_segment == CustomerSegment.AT_RISK_HIGH_VALUE.value
    assert opportunity.estimated_recoverable_revenue > 0
    
    events = (await seeded_db.execute(select(AuditEvent).where(AuditEvent.merchant_id == merchant.id))).scalars().all()
    assert len(events) >= 2
