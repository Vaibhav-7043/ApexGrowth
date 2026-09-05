import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.models.merchant import Merchant
from backend.app.services.analytics_service import AnalyticsService
from sqlalchemy import select

@pytest.mark.asyncio
async def test_deterministic_analytics(seeded_db: AsyncSession):
    merchant = (await seeded_db.execute(select(Merchant))).scalar_one_or_none()
    assert merchant is not None
    
    overview = await AnalyticsService.get_overview(seeded_db, merchant.id)
    
    # Assert deterministic metrics are present and non-zero
    assert overview.total_revenue_30d > 0
    assert overview.total_customers == 220
    assert overview.at_risk_customers_count > 0
    assert overview.at_risk_revenue_inr > 0
    assert overview.average_order_value > 0
    assert overview.total_orders_30d > 0
    assert overview.payment_success_rate > 90.0
    assert len(overview.segments) >= 5
    
    # Verify segment breakdown accuracy
    seg_names = [s.segment for s in overview.segments]
    assert "at_risk_high_value" in seg_names
    assert "champions" in seg_names
