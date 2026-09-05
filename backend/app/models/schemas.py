from datetime import datetime
from typing import Any, List, Dict, Optional
from pydantic import BaseModel, Field, ConfigDict

# Merchant Schemas
class MerchantBase(BaseModel):
    name: str
    business_type: str = 'Retail'
    category: Optional[str] = 'Retail'
    website: Optional[str] = None
    currency: str = 'INR'
    contact_email: str
    is_demo: bool = False
    is_razorpay_connected: bool = True

class MerchantRead(MerchantBase):
    id: str
    user_id: Optional[str] = None
    created_at: datetime
    settings: Dict[str, Any] = {}
    model_config = ConfigDict(from_attributes=True)

# User / Auth Schemas
class UserRegisterRequest(BaseModel):
    full_name: str
    email: str
    password: str

class UserLoginRequest(BaseModel):
    email: str
    password: str

class UserRead(BaseModel):
    id: str
    email: str
    full_name: str
    is_onboarded: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class AuthResponse(BaseModel):
    token: str
    user: UserRead
    merchant: Optional[MerchantRead] = None

class BusinessSetupRequest(BaseModel):
    name: str
    category: str = 'Retail'
    website: Optional[str] = None

class ConnectRazorpayRequest(BaseModel):
    key_id: Optional[str] = None
    key_secret: Optional[str] = None
    mode: str = 'test'

class OnboardingStatusRead(BaseModel):
    step: int
    is_completed: bool
    merchant: Optional[MerchantRead] = None

# Customer Schemas
class CustomerRead(BaseModel):
    id: str
    name: str
    email: str
    phone: Optional[str] = None
    total_spend: float
    order_count: int
    average_order_value: float
    first_order_at: Optional[datetime] = None
    last_order_at: Optional[datetime] = None
    days_since_last_order: int
    rfm_segment: str
    churn_risk_score: float
    last_incentive_sent_at: Optional[datetime] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class SegmentSummary(BaseModel):
    segment: str
    customer_count: int
    total_spend: float
    average_order_value: float
    average_days_inactive: float
    at_risk_revenue: float

# Analytics Schemas
class MetricTrend(BaseModel):
    current_30d: float
    previous_30d: float
    growth_percent: float

class AnalyticsOverview(BaseModel):
    total_revenue_30d: float
    revenue_trend: MetricTrend
    total_customers: int
    active_customers_30d: int
    at_risk_customers_count: int
    at_risk_revenue_inr: float
    average_order_value: float
    total_orders_30d: int
    payment_success_rate: float
    segments: List[SegmentSummary]
    currency: str = 'INR'

# Policy Schemas
class PolicyConfigBase(BaseModel):
    max_discount_percent: float = Field(default=20.0, ge=1.0, le=50.0)
    max_campaign_audience: int = Field(default=500, ge=1, le=10000)
    max_budget_inr: float = Field(default=50000.0, ge=100.0)
    cooldown_days_per_customer: int = Field(default=14, ge=1, le=365)
    require_manual_approval_above_inr: float = Field(default=5000.0, ge=0.0)

class PolicyConfigRead(PolicyConfigBase):
    id: str
    merchant_id: str
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

class PolicyConfigUpdate(BaseModel):
    max_discount_percent: Optional[float] = None
    max_campaign_audience: Optional[int] = None
    max_budget_inr: Optional[float] = None
    cooldown_days_per_customer: Optional[int] = None
    require_manual_approval_above_inr: Optional[float] = None

# Approval Schemas
class ApprovalDecisionRequest(BaseModel):
    approved: bool
    decided_by: str = 'merchant_admin'
    rejection_reason: Optional[str] = None

class ApprovalRequestRead(BaseModel):
    id: str
    strategy_id: str
    status: str
    policy_checks_passed: bool
    policy_validation_report: Dict[str, Any]
    requested_at: datetime
    decided_at: Optional[datetime] = None
    decided_by: Optional[str] = None
    rejection_reason: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

# Strategy & Why Explanation Schemas
class StrategyRead(BaseModel):
    id: str
    opportunity_id: str
    name: str
    action_type: str
    proposed_discount_percent: float
    validity_hours: int
    min_order_amount: float
    target_audience_count: int
    estimated_campaign_cost: float
    estimated_gross_revenue: float
    estimated_net_lift: float
    projected_roi: float
    why_explanation: Dict[str, Any]
    approval_request: Optional[ApprovalRequestRead] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# Opportunity Schemas
class OpportunityRead(BaseModel):
    id: str
    merchant_id: str
    type: str
    title: str
    summary: str
    target_segment: str
    target_customer_count: int
    total_historical_spend: float
    average_customer_aov: float
    estimated_recoverable_revenue: float
    urgency: str
    status: str
    evidence: Dict[str, Any]
    strategy: Optional[StrategyRead] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# Campaign Schemas
class CampaignActionRead(BaseModel):
    id: str
    campaign_id: str
    customer_id: str
    razorpay_payment_link_id: str
    razorpay_short_url: str
    original_amount: float
    discount_amount: float
    final_amount: float
    status: str
    failure_reason: Optional[str] = None
    created_at: datetime
    executed_at: Optional[datetime] = None
    paid_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)

class CampaignRead(BaseModel):
    id: str
    merchant_id: str
    approval_request_id: str
    name: str
    status: str
    execution_mode: str
    target_count: int
    links_created_count: int
    conversions_count: int
    budget_cap: float
    actual_incentive_spent: float
    actual_revenue_generated: float
    net_revenue_lift: float
    realized_roi: float
    execution_details: Dict[str, Any]
    created_at: datetime
    completed_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)

class CampaignExecutionRequest(BaseModel):
    approval_request_id: str
    idempotency_key: Optional[str] = None

class CampaignMetricsRead(BaseModel):
    campaign_id: str
    status: str
    execution_mode: str
    target_audience: int
    links_created: int
    conversions_count: int
    conversion_rate_percent: float
    
    # Projected Metrics (from AI Strategy)
    projected_gross_revenue: float
    projected_campaign_cost: float
    projected_net_lift: float
    projected_roi: float
    
    # Actual Metrics (from real/simulated transactions)
    actual_gross_revenue: float
    actual_campaign_cost: float
    actual_net_lift: float
    actual_roi: float
    
    currency: str = 'INR'

# Simulation Schemas
class PaymentSimulationRequest(BaseModel):
    action_id: str
    event_type: str = Field('SUCCESS', description='SUCCESS, FAILURE, or EXPIRED')
    payment_method: str = Field('upi', description='upi, card, netbanking')
    failure_reason: Optional[str] = None

class PaymentSimulationResponse(BaseModel):
    status: str
    action_id: str
    event_type: str
    payment_id: Optional[str] = None
    attributed_revenue: Optional[float] = None
    campaign_id: str
    message: str

# Audit Schemas
class AuditEventRead(BaseModel):
    id: str
    merchant_id: str
    sequence_number: int
    timestamp: datetime
    actor_type: str
    actor_id: str
    action: str
    target_type: str
    target_id: str
    summary: str
    details: Dict[str, Any]
    policy_passed: bool
    prev_hash: str
    current_hash: str
    model_config = ConfigDict(from_attributes=True)

class AuditChainVerification(BaseModel):
    is_valid: bool
    total_events: int
    genesis_hash: Optional[str] = None
    latest_hash: Optional[str] = None
    tampered_event_id: Optional[str] = None
    error_message: Optional[str] = None
    verified_at: datetime = Field(default_factory=datetime.utcnow)
