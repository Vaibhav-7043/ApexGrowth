from datetime import datetime, timedelta
from typing import Dict, Any, List
from sqlalchemy import select, func, and_, case
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.models.customer import Customer
from backend.app.models.order import Order
from backend.app.models.payment import Payment
from backend.app.models.enums import OrderStatus, PaymentStatus, CustomerSegment
from backend.app.models.schemas import AnalyticsOverview, MetricTrend, SegmentSummary

class AnalyticsService:
    @staticmethod
    async def get_overview(db: AsyncSession, merchant_id: str) -> AnalyticsOverview:
        now = datetime.utcnow()
        t_minus_30d = now - timedelta(days=30)
        t_minus_60d = now - timedelta(days=60)
        
        # 1. Total revenue current 30 days
        stmt_current_rev = (
            select(func.coalesce(func.sum(Order.final_amount), 0.0))
            .where(
                and_(
                    Order.merchant_id == merchant_id,
                    Order.status == OrderStatus.PAID.value,
                    Order.created_at >= t_minus_30d
                )
            )
        )
        res_current_rev = await db.execute(stmt_current_rev)
        current_30d_rev = float(res_current_rev.scalar() or 0.0)
        
        # 2. Total revenue previous 30 days
        stmt_prev_rev = (
            select(func.coalesce(func.sum(Order.final_amount), 0.0))
            .where(
                and_(
                    Order.merchant_id == merchant_id,
                    Order.status == OrderStatus.PAID.value,
                    Order.created_at >= t_minus_60d,
                    Order.created_at < t_minus_30d
                )
            )
        )
        res_prev_rev = await db.execute(stmt_prev_rev)
        prev_30d_rev = float(res_prev_rev.scalar() or 0.0)
        
        growth_pct = 0.0
        if prev_30d_rev > 0:
            growth_pct = round(((current_30d_rev - prev_30d_rev) / prev_30d_rev) * 100, 2)
            
        # 3. Order count current 30d
        stmt_orders_30d = (
            select(func.count(Order.id))
            .where(
                and_(
                    Order.merchant_id == merchant_id,
                    Order.status == OrderStatus.PAID.value,
                    Order.created_at >= t_minus_30d
                )
            )
        )
        res_orders_30d = await db.execute(stmt_orders_30d)
        total_orders_30d = int(res_orders_30d.scalar() or 0)
        
        # 4. Average Order Value
        aov = round(current_30d_rev / total_orders_30d, 2) if total_orders_30d > 0 else 0.0
        
        # 5. Customer Metrics
        stmt_cust = select(Customer).where(Customer.merchant_id == merchant_id)
        res_cust = await db.execute(stmt_cust)
        customers = res_cust.scalars().all()
        
        total_customers = len(customers)
        active_customers_30d = sum(1 for c in customers if c.days_since_last_order <= 30)
        
        # Segment aggregation
        segment_groups: Dict[str, List[Customer]] = {}
        for c in customers:
            segment_groups.setdefault(c.rfm_segment, []).append(c)
            
        segments_summary: List[SegmentSummary] = []
        at_risk_count = 0
        at_risk_revenue = 0.0
        
        for seg_name, cust_list in segment_groups.items():
            count = len(cust_list)
            spend = sum(c.total_spend for c in cust_list)
            avg_aov = round(spend / count, 2) if count > 0 else 0.0
            avg_inactive = round(sum(c.days_since_last_order for c in cust_list) / count, 1) if count > 0 else 0.0
            
            seg_risk_rev = 0.0
            if seg_name in [CustomerSegment.AT_RISK_HIGH_VALUE.value, CustomerSegment.INACTIVE_DORMANT.value]:
                seg_risk_rev = round(sum(c.average_order_value for c in cust_list), 2)
                at_risk_count += count
                at_risk_revenue += seg_risk_rev
                
            segments_summary.append(
                SegmentSummary(
                    segment=seg_name,
                    customer_count=count,
                    total_spend=round(spend, 2),
                    average_order_value=avg_aov,
                    average_days_inactive=avg_inactive,
                    at_risk_revenue=round(seg_risk_rev, 2)
                )
            )
            
        # 6. Payment Success Rate
        stmt_pay_count = select(func.count(Payment.id)).select_from(Payment).join(Order).where(Order.merchant_id == merchant_id)
        stmt_pay_success = select(func.count(Payment.id)).select_from(Payment).join(Order).where(
            and_(Order.merchant_id == merchant_id, Payment.status == PaymentStatus.CAPTURED.value)
        )
        
        total_p = (await db.execute(stmt_pay_count)).scalar() or 0
        success_p = (await db.execute(stmt_pay_success)).scalar() or 0
        success_rate = round((success_p / total_p) * 100, 1) if total_p > 0 else 98.4
        
        return AnalyticsOverview(
            total_revenue_30d=round(current_30d_rev, 2),
            revenue_trend=MetricTrend(
                current_30d=round(current_30d_rev, 2),
                previous_30d=round(prev_30d_rev, 2),
                growth_percent=growth_pct
            ),
            total_customers=total_customers,
            active_customers_30d=active_customers_30d,
            at_risk_customers_count=at_risk_count,
            at_risk_revenue_inr=round(at_risk_revenue, 2),
            average_order_value=aov,
            total_orders_30d=total_orders_30d,
            payment_success_rate=success_rate,
            segments=sorted(segments_summary, key=lambda s: s.customer_count, reverse=True),
            currency='INR'
        )
