from enum import Enum

class CustomerSegment(str, Enum):
    CHAMPIONS = 'champions'                    # High spend, frequent, recent
    LOYAL_REGULARS = 'loyal_regulars'          # Steady regular buyers
    AT_RISK_HIGH_VALUE = 'at_risk_high_value'  # High historic spend, inactive > 45 days
    INACTIVE_DORMANT = 'inactive_dormant'      # Inactive > 60 days
    CART_ABANDONERS = 'cart_abandoners'        # Initiated checkout without paying
    PRICE_SENSITIVE = 'price_sensitive'        # Respond mainly to promotions
    NEW_CUSTOMERS = 'new_customers'            # 1 recent purchase

class OrderStatus(str, Enum):
    CREATED = 'created'
    PAID = 'paid'
    FAILED = 'failed'
    REFUNDED = 'refunded'
    ABANDONED = 'abandoned'

class PaymentStatus(str, Enum):
    AUTHORIZED = 'authorized'
    CAPTURED = 'captured'
    FAILED = 'failed'
    REFUNDED = 'refunded'

class OpportunityType(str, Enum):
    INACTIVE_RETENTION = 'inactive_retention'
    CHURN_PREVENTION = 'churn_prevention'
    ABANDONED_CHECKOUT_RECOVERY = 'abandoned_checkout_recovery'
    HIGH_VALUE_UPSELL = 'high_value_upsell'
    CROSS_SELL = 'cross_sell'

class OpportunityStatus(str, Enum):
    DISCOVERED = 'discovered'
    ANALYZING = 'analyzing'
    STRATEGY_GENERATED = 'strategy_generated'
    APPROVED = 'approved'
    EXECUTED = 'executed'
    DISMISSED = 'dismissed'

class ApprovalStatus(str, Enum):
    DRAFT = 'draft'
    POLICY_VALIDATED = 'policy_validated'
    POLICY_BLOCKED = 'policy_blocked'
    PENDING_APPROVAL = 'pending_approval'
    APPROVED = 'approved'
    REJECTED = 'rejected'
    EXECUTING = 'executing'
    COMPLETED = 'completed'
    FAILED = 'failed'

class CampaignStatus(str, Enum):
    DRAFT = 'draft'
    SCHEDULED = 'scheduled'
    RUNNING = 'running'
    COMPLETED = 'completed'
    FAILED = 'failed'
    PAUSED = 'paused'

class CampaignActionStatus(str, Enum):
    PENDING = 'pending'
    SENT = 'sent'
    CLICKED = 'clicked'
    PAYMENT_PENDING = 'payment_pending'
    PAID = 'paid'
    FAILED = 'failed'
    EXPIRED = 'expired'

class ActorType(str, Enum):
    AGENT = 'agent'
    MERCHANT = 'merchant'
    POLICY_ENGINE = 'policy_engine'
    RAZORPAY_API = 'razorpay_api'
    SANDBOX_SIMULATOR = 'sandbox_simulator'
    WEBHOOK = 'webhook'
    SYSTEM = 'system'
