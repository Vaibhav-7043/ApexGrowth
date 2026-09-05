from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.models.customer import Customer
from backend.app.models.order import Order
from backend.app.models.enums import CustomerSegment, OrderStatus, OpportunityType

class AgentTools:
    @staticmethod
    async def get_business_overview(db: AsyncSession, merchant_id: str) -> Dict[str, Any]:
        now = datetime.utcnow()
        t_minus_30d = now - timedelta(days=30)
        
        # 30d Revenue
        rev_stmt = (
            select(func.coalesce(func.sum(Order.final_amount), 0.0))
            .where(and_(Order.merchant_id == merchant_id, Order.status == OrderStatus.PAID.value, Order.created_at >= t_minus_30d))
        )
        rev_30d = float((await db.execute(rev_stmt)).scalar() or 0.0)
        
        # Total active customers
        cust_stmt = select(Customer).where(Customer.merchant_id == merchant_id)
        customers = (await db.execute(cust_stmt)).scalars().all()
        
        total_customers = len(customers)
        active_30d = sum(1 for c in customers if c.days_since_last_order <= 30)
        
        return {
            'total_revenue_30d': round(rev_30d, 2),
            'total_customers': total_customers,
            'active_customers_30d': active_30d,
            'currency': 'INR'
        }

    @staticmethod
    async def get_customer_segments(db: AsyncSession, merchant_id: str) -> List[Dict[str, Any]]:
        stmt = select(Customer).where(Customer.merchant_id == merchant_id)
        customers = (await db.execute(stmt)).scalars().all()
        
        segment_map: Dict[str, List[Customer]] = {}
        for c in customers:
            segment_map.setdefault(c.rfm_segment, []).append(c)
            
        summaries = []
        for seg_name, custs in segment_map.items():
            count = len(custs)
            spend = sum(c.total_spend for c in custs)
            aov = round(spend / count, 2) if count > 0 else 0.0
            avg_inactive = round(sum(c.days_since_last_order for c in custs) / count, 1) if count > 0 else 0.0
            
            summaries.append({
                'segment': seg_name,
                'customer_count': count,
                'total_spend': round(spend, 2),
                'average_order_value': aov,
                'average_days_inactive': avg_inactive
            })
        return sorted(summaries, key=lambda s: s['customer_count'], reverse=True)

    @staticmethod
    async def get_segment_details(db: AsyncSession, merchant_id: str, segment: str) -> Dict[str, Any]:
        stmt = select(Customer).where(and_(Customer.merchant_id == merchant_id, Customer.rfm_segment == segment))
        customers = (await db.execute(stmt)).scalars().all()
        
        count = len(customers)
        total_spend = sum(c.total_spend for c in customers)
        total_orders = sum(c.order_count for c in customers)
        avg_aov = round(total_spend / total_orders, 2) if total_orders > 0 else 0.0
        avg_inactive = round(sum(c.days_since_last_order for c in customers) / count, 1) if count > 0 else 0.0
        
        sample_customers = [
            {
                'id': c.id,
                'name': c.name,
                'email': c.email,
                'total_spend': c.total_spend,
                'order_count': c.order_count,
                'average_order_value': c.average_order_value,
                'days_inactive': c.days_since_last_order,
                'last_incentive_sent_at': c.last_incentive_sent_at.isoformat() if c.last_incentive_sent_at else None
            }
            for c in customers[:5]
        ]
        
        return {
            'segment': segment,
            'customer_count': count,
            'total_historical_spend': round(total_spend, 2),
            'average_customer_aov': avg_aov,
            'average_days_inactive': avg_inactive,
            'sample_cohort': sample_customers
        }

    @staticmethod
    def calculate_strategy_financials(
        customer_count: int,
        average_aov: float,
        discount_percent: float,
        expected_conversion_rate: float = 0.35
    ) -> Dict[str, float]:
        '''
        100% Deterministic calculation of campaign financial bounds.
        Never hallucinated by LLM.
        '''
        expected_orders = max(1, round(customer_count * expected_conversion_rate))
        estimated_gross_revenue = round(expected_orders * average_aov, 2)
        estimated_campaign_cost = round(estimated_gross_revenue * (discount_percent / 100.0), 2)
        estimated_net_lift = round(estimated_gross_revenue - estimated_campaign_cost, 2)
        projected_roi = round(estimated_gross_revenue / estimated_campaign_cost, 2) if estimated_campaign_cost > 0 else 0.0
        
        return {
            'target_customer_count': customer_count,
            'expected_orders': expected_orders,
            'discount_percent': discount_percent,
            'estimated_gross_revenue': estimated_gross_revenue,
            'estimated_campaign_cost': estimated_campaign_cost,
            'estimated_net_lift': estimated_net_lift,
            'projected_roi': projected_roi
        }
