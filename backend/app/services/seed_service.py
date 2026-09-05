import random
import uuid
from datetime import datetime, timedelta
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.models.merchant import Merchant
from backend.app.models.policy_config import PolicyConfig
from backend.app.models.customer import Customer
from backend.app.models.order import Order
from backend.app.models.payment import Payment
from backend.app.models.opportunity import Opportunity
from backend.app.models.enums import CustomerSegment, OrderStatus, PaymentStatus, OpportunityType, OpportunityStatus, ActorType
from backend.app.services.audit_service import AuditService

INDIAN_FIRST_NAMES = [
    'Aarav', 'Aditi', 'Advait', 'Ananya', 'Arjun', 'Bhavya', 'Chirag', 'Deepak', 'Divya', 'Gaurav',
    'Ishaan', 'Kabir', 'Kavya', 'Manish', 'Meera', 'Neha', 'Nikhil', 'Pooja', 'Pranav', 'Priya',
    'Rahul', 'Rhea', 'Rohan', 'Sakshi', 'Sameer', 'Sanaya', 'Siddharth', 'Sneha', 'Tanvi', 'Varun',
    'Vikram', 'Yash', 'Zoya', 'Aditya', 'Aishwarya', 'Akash', 'Amrita', 'Ankit', 'Archana', 'Dev'
]

INDIAN_LAST_NAMES = [
    'Sharma', 'Verma', 'Patel', 'Reddy', 'Iyer', 'Nair', 'Menon', 'Gupta', 'Mehta', 'Joshi',
    'Kulkarni', 'Deshmukh', 'Singhania', 'Kapoor', 'Malhotra', 'Bhat', 'Rao', 'Choudhury', 'Sen', 'Das'
]

COFFEE_PRODUCTS = [
    ('Monsooned Malabar AA (500g)', 899.0),
    ('Chikmagalur Estate Arabica (500g)', 749.0),
    ('Coorg Dark Roast Blend (1kg)', 1299.0),
    ('Cold Brew Reserve Pack (3x250ml)', 649.0),
    ('Pour-Over Starter Kit & Beans', 2499.0),
    ('Single Origin Filter Coffee (500g)', 599.0),
    ('Espresso Roast Pods (Pack of 30)', 1499.0),
]

class SeedService:
    @staticmethod
    async def reset_and_seed(db: AsyncSession) -> Merchant:
        from backend.app.db.session import init_db
        await init_db()
        # 1. Clean existing tables
        tables = [Payment, Order, Customer, Opportunity, PolicyConfig, Merchant]
        from backend.app.models.campaign_action import CampaignAction
        from backend.app.models.campaign import Campaign
        from backend.app.models.approval import ApprovalRequest
        from backend.app.models.strategy import Strategy
        from backend.app.models.audit_event import AuditEvent
        
        from backend.app.models.user import User
        from backend.app.services.auth_service import SecurityService

        for model in [AuditEvent, CampaignAction, Campaign, ApprovalRequest, Strategy, Opportunity, Payment, Order, Customer, PolicyConfig, Merchant, User]:
            await db.execute(delete(model))
        await db.commit()
        
        # 2. Create Demo User
        pwd_hash, salt = SecurityService.hash_password('password123')
        user = User(
            id=str(uuid.uuid4()),
            email='merchant@artisanroasters.in',
            full_name='Artisan Founder',
            password_hash=pwd_hash,
            password_salt=salt,
            is_onboarded=True
        )
        db.add(user)
        await db.flush()

        # 3. Create Merchant
        merchant = Merchant(
            id=str(uuid.uuid4()),
            user_id=user.id,
            name='Artisan Roasters Co.',
            business_type='D2C Specialty Coffee & Brewing Gear',
            category='Food & Beverage',
            website='https://artisanroasters.in',
            currency='INR',
            contact_email='founder@artisanroasters.in',
            is_demo=True,
            is_razorpay_connected=True,
            settings={'timezone': 'Asia/Kolkata', 'tax_rate': 0.05}
        )
        db.add(merchant)
        await db.flush()
        
        # 3. Create Policy Config
        policy = PolicyConfig(
            merchant_id=merchant.id,
            max_discount_percent=20.0,
            max_campaign_audience=500,
            max_budget_inr=50000.0,
            cooldown_days_per_customer=14,
            require_manual_approval_above_inr=5000.0
        )
        db.add(policy)
        await db.flush()
        
        # 4. Generate 220 Realistic Customers with consistent RFM metrics
        random.seed(42) # Deterministic realistic seed
        customers = []
        orders = []
        payments = []
        now = datetime.utcnow()
        
        # Define target distributions
        # - 42 At-Risk High Value customers (our prime target)
        # - 35 Champions (frequent, high spend, recent)
        # - 60 Loyal Regulars
        # - 45 Inactive Dormant (>90 days)
        # - 20 Cart Abandoners
        # - 18 New Customers
        
        customer_specs = (
            [(CustomerSegment.AT_RISK_HIGH_VALUE, 42, (5000.0, 18000.0), (3, 7), (48, 85))] +
            [(CustomerSegment.CHAMPIONS, 35, (8000.0, 32000.0), (5, 12), (3, 25))] +
            [(CustomerSegment.LOYAL_REGULARS, 60, (3000.0, 9500.0), (3, 6), (10, 42))] +
            [(CustomerSegment.INACTIVE_DORMANT, 45, (1500.0, 6000.0), (1, 3), (92, 180))] +
            [(CustomerSegment.NEW_CUSTOMERS, 20, (650.0, 1800.0), (1, 1), (2, 28))] +
            [(CustomerSegment.CART_ABANDONERS, 18, (0.0, 0.0), (0, 0), (5, 30))]
        )
        
        used_emails = set()
        for segment_enum, count, spend_range, order_range, days_inactive_range in customer_specs:
            for _ in range(count):
                fn = random.choice(INDIAN_FIRST_NAMES)
                ln = random.choice(INDIAN_LAST_NAMES)
                email = f'{fn.lower()}.{ln.lower()}{random.randint(10, 999)}@gmail.com'
                while email in used_emails:
                    email = f'{fn.lower()}.{ln.lower()}{random.randint(1000, 9999)}@gmail.com'
                used_emails.add(email)
                
                days_inactive = random.randint(days_inactive_range[0], days_inactive_range[1])
                last_order_dt = now - timedelta(days=days_inactive) if order_range[1] > 0 else None
                order_cnt = random.randint(order_range[0], order_range[1])
                
                if order_cnt > 0:
                    total_sp = round(random.uniform(spend_range[0], spend_range[1]), 2)
                    aov = round(total_sp / order_cnt, 2)
                else:
                    total_sp = 0.0
                    aov = 0.0
                    
                churn_score = 0.85 if segment_enum == CustomerSegment.AT_RISK_HIGH_VALUE else (
                    0.95 if segment_enum == CustomerSegment.INACTIVE_DORMANT else (
                        0.15 if segment_enum == CustomerSegment.CHAMPIONS else 0.40
                    )
                )
                
                first_order_dt = (last_order_dt - timedelta(days=random.randint(30, 200))) if last_order_dt else None
                
                cust = Customer(
                    id=str(uuid.uuid4()),
                    merchant_id=merchant.id,
                    name=f'{fn} {ln}',
                    email=email,
                    phone=f'+91 98{random.randint(10000000, 99999999)}',
                    total_spend=total_sp,
                    order_count=order_cnt,
                    average_order_value=aov,
                    first_order_at=first_order_dt,
                    last_order_at=last_order_dt,
                    days_since_last_order=days_inactive,
                    rfm_segment=segment_enum.value,
                    churn_risk_score=churn_score
                )
                db.add(cust)
                customers.append(cust)
                
                # Generate individual orders for this customer to establish historical record
                if order_cnt > 0:
                    for ord_idx in range(order_cnt):
                        if ord_idx == order_cnt - 1:
                            ord_dt = last_order_dt
                        elif ord_idx == 0:
                            ord_dt = first_order_dt or (last_order_dt - timedelta(days=60))
                        else:
                            span = max(1, (last_order_dt - first_order_dt).days if first_order_dt else 30)
                            ord_dt = (first_order_dt or last_order_dt) + timedelta(days=random.randint(5, span))
                            
                        prod_name, prod_price = random.choice(COFFEE_PRODUCTS)
                        ord_amt = round(prod_price * random.choice([1, 1, 2]), 2)
                        
                        order = Order(
                            id=str(uuid.uuid4()),
                            merchant_id=merchant.id,
                            customer_id=cust.id,
                            order_number=f'ORD-{random.randint(100000, 999999)}',
                            amount=ord_amt,
                            discount_amount=0.0,
                            final_amount=ord_amt,
                            currency='INR',
                            status=OrderStatus.PAID.value,
                            razorpay_order_id=f'order_test_{uuid.uuid4().hex[:14]}',
                            created_at=ord_dt
                        )
                        db.add(order)
                        orders.append(order)
                        
                        payment = Payment(
                            id=str(uuid.uuid4()),
                            order_id=order.id,
                            razorpay_payment_id=f'pay_test_{uuid.uuid4().hex[:14]}',
                            amount=ord_amt,
                            currency='INR',
                            method=random.choice(['upi', 'upi', 'card', 'netbanking']),
                            status=PaymentStatus.CAPTURED.value,
                            fee=round(ord_amt * 0.02, 2),
                            tax=round(ord_amt * 0.02 * 0.18, 2),
                            created_at=ord_dt + timedelta(seconds=random.randint(15, 90))
                        )
                        db.add(payment)
                        payments.append(payment)
                        
        await db.flush()
        
        # 5. Create Prime Discovered Growth Opportunity from Grounded Data
        at_risk_cohort = [c for c in customers if c.rfm_segment == CustomerSegment.AT_RISK_HIGH_VALUE.value]
        cohort_count = len(at_risk_cohort)
        cohort_historical_spend = sum(c.total_spend for c in at_risk_cohort)
        cohort_aov = round(cohort_historical_spend / sum(c.order_count for c in at_risk_cohort), 2)
        estimated_recoverable = round(cohort_count * cohort_aov * 0.35, 2) # estimated 35% winback
        
        opportunity = Opportunity(
            id=str(uuid.uuid4()),
            merchant_id=merchant.id,
            type=OpportunityType.INACTIVE_RETENTION.value,
            title='High-Value Inactive Customer Winback',
            summary=f'{cohort_count} high-spending customers (historical AOV ₹{cohort_aov:,.2f}) have become inactive in the last 45-85 days. Direct targeted incentive via Razorpay Payment Link can recover dormant revenue.',
            target_segment=CustomerSegment.AT_RISK_HIGH_VALUE.value,
            target_customer_count=cohort_count,
            total_historical_spend=round(cohort_historical_spend, 2),
            average_customer_aov=cohort_aov,
            estimated_recoverable_revenue=estimated_recoverable,
            urgency='HIGH',
            status=OpportunityStatus.DISCOVERED.value,
            evidence={
                'segment_name': 'At-Risk High Value',
                'dormant_days_average': 62.4,
                'historical_orders_per_customer': 4.6,
                'churn_probability': 0.85,
                'sample_customers': [
                    {'name': c.name, 'email': c.email, 'spend': c.total_spend, 'days_inactive': c.days_since_last_order}
                    for c in at_risk_cohort[:4]
                ]
            }
        )
        db.add(opportunity)
        await db.flush()
        
        # 6. Initialize Tamper-Evident Audit Chain
        await AuditService.log_event(
            db=db,
            merchant_id=merchant.id,
            actor_type=ActorType.SYSTEM.value,
            actor_id='seed_engine',
            action='SYSTEM_DATABASE_SEEDED',
            target_type='merchant',
            target_id=merchant.id,
            summary='Database initialized with 220 customers, 600+ orders, and policy rules.',
            details={
                'customer_count': len(customers),
                'orders_count': len(orders),
                'payments_count': len(payments),
                'merchant_name': merchant.name
            },
            policy_passed=True
        )
        
        await AuditService.log_event(
            db=db,
            merchant_id=merchant.id,
            actor_type=ActorType.AGENT.value,
            actor_id='growth_agent',
            action='OPPORTUNITY_DISCOVERED',
            target_type='opportunity',
            target_id=opportunity.id,
            summary=f'Discovered high-value inactive cohort: {cohort_count} customers representing ₹{cohort_historical_spend:,.2f} historic spend.',
            details={
                'opportunity_id': opportunity.id,
                'target_segment': opportunity.target_segment,
                'customer_count': opportunity.target_customer_count,
                'estimated_recoverable_revenue': opportunity.estimated_recoverable_revenue
            },
            policy_passed=True
        )
        
        await db.commit()
        return merchant
