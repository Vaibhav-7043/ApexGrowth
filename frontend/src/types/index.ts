export interface HealthStatus {
  status: string;
  database: string;
  environment: string;
  llm_provider: string;
  razorpay_mode: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  is_onboarded: boolean;
  created_at: string;
}

export interface Merchant {
  id: string;
  user_id?: string;
  name: string;
  business_type: string;
  category?: string;
  website?: string;
  currency: string;
  contact_email: string;
  is_demo: boolean;
  is_razorpay_connected: boolean;
  created_at: string;
  settings: Record<string, any>;
}

export interface AuthResponse {
  token: string;
  user: User;
  merchant?: Merchant;
}

export interface OnboardingStatus {
  step: number;
  is_completed: boolean;
  merchant?: Merchant;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  total_spend: number;
  order_count: number;
  average_order_value: number;
  first_order_at?: string;
  last_order_at?: string;
  days_since_last_order: number;
  rfm_segment: string;
  churn_risk_score: number;
  last_incentive_sent_at?: string;
  created_at: string;
}

export interface SegmentSummary {
  segment: string;
  customer_count: number;
  total_spend: number;
  average_order_value: number;
  average_days_inactive: number;
  at_risk_revenue: number;
}

export interface MetricTrend {
  current_30d: number;
  previous_30d: number;
  growth_percent: number;
}

export interface AnalyticsOverview {
  total_revenue_30d: number;
  revenue_trend: MetricTrend;
  total_customers: number;
  active_customers_30d: number;
  at_risk_customers_count: number;
  at_risk_revenue_inr: number;
  average_order_value: number;
  total_orders_30d: number;
  payment_success_rate: number;
  segments: SegmentSummary[];
  currency: string;
}

export interface WhyExplanation {
  core_insight: string;
  data_evidence: {
    segment: string;
    target_cohort_size: number;
    historical_spend_inr: number;
    historical_aov_inr: number;
    average_dormancy_days: number;
    sample_customers: Array<{
      name: string;
      email?: string;
      total_spend: number;
      days_inactive: number;
    }>;
  };
  financial_breakdown: {
    proposed_discount_pct: number;
    estimated_gross_revenue: number;
    estimated_incentive_cost: number;
    estimated_net_revenue_lift: number;
    projected_roi_multiplier: number;
  };
  selection_rationale: string;
  grounded_in_db: boolean;
}

export interface Strategy {
  id: string;
  opportunity_id: string;
  name: string;
  action_type: string;
  proposed_discount_percent: number;
  validity_hours: number;
  min_order_amount: number;
  target_audience_count: number;
  estimated_campaign_cost: number;
  estimated_gross_revenue: number;
  estimated_net_lift: number;
  projected_roi: number;
  why_explanation: WhyExplanation;
  approval_request?: ApprovalRequest;
  created_at: string;
}

export interface Opportunity {
  id: string;
  merchant_id: string;
  type: string;
  title: string;
  summary: string;
  target_segment: string;
  target_customer_count: number;
  total_historical_spend: number;
  average_customer_aov: number;
  estimated_recoverable_revenue: number;
  urgency: 'HIGH' | 'MEDIUM' | 'LOW';
  status: string;
  evidence: Record<string, any>;
  strategy?: Strategy;
  created_at: string;
}

export interface ApprovalRequest {
  id: string;
  strategy_id: string;
  status: 'draft' | 'policy_validated' | 'policy_blocked' | 'pending_approval' | 'approved' | 'rejected' | 'executing' | 'completed' | 'failed';
  policy_checks_passed: boolean;
  policy_validation_report: {
    passed: boolean;
    violations: string[];
    checks: Record<string, boolean>;
    requires_manual_approval: boolean;
    validated_at: string;
  };
  requested_at: string;
  decided_at?: string;
  decided_by?: string;
  rejection_reason?: string;
}

export interface PolicyConfig {
  id: string;
  merchant_id: string;
  max_discount_percent: number;
  max_campaign_audience: number;
  max_budget_inr: number;
  cooldown_days_per_customer: number;
  require_manual_approval_above_inr: number;
  updated_at: string;
}

export interface Campaign {
  id: string;
  merchant_id: string;
  approval_request_id: string;
  name: string;
  status: string;
  execution_mode: 'razorpay_test' | 'sandbox_simulator';
  target_count: number;
  links_created_count: number;
  conversions_count: number;
  budget_cap: number;
  actual_incentive_spent: number;
  actual_revenue_generated: number;
  net_revenue_lift: number;
  realized_roi: number;
  execution_details: Record<string, any>;
  created_at: string;
  completed_at?: string;
}

export interface CampaignAction {
  id: string;
  campaign_id: string;
  customer_id: string;
  razorpay_payment_link_id: string;
  razorpay_short_url: string;
  original_amount: number;
  discount_amount: number;
  final_amount: number;
  status: 'pending' | 'sent' | 'clicked' | 'payment_pending' | 'paid' | 'failed' | 'expired';
  failure_reason?: string;
  created_at: string;
  executed_at?: string;
  paid_at?: string;
}

export interface CampaignMetrics {
  campaign_id: string;
  status: string;
  execution_mode: string;
  target_audience: number;
  links_created: number;
  conversions_count: number;
  conversion_rate_percent: number;
  projected_gross_revenue: number;
  projected_campaign_cost: number;
  projected_net_lift: number;
  projected_roi: number;
  actual_gross_revenue: number;
  actual_campaign_cost: number;
  actual_net_lift: number;
  actual_roi: number;
  currency: string;
}

export interface AuditEvent {
  id: string;
  merchant_id: string;
  sequence_number: number;
  timestamp: string;
  actor_type: string;
  actor_id: string;
  action: string;
  target_type: string;
  target_id: string;
  summary: string;
  details: Record<string, any>;
  policy_passed: boolean;
  prev_hash: string;
  current_hash: string;
}

export interface AuditChainVerification {
  is_valid: boolean;
  total_events: number;
  genesis_hash?: string;
  latest_hash?: string;
  tampered_event_id?: string;
  error_message?: string;
  verified_at: string;
}

export interface PaymentSimulationResponse {
  status: string;
  action_id: string;
  event_type: string;
  payment_id?: string;
  attributed_revenue?: number;
  campaign_id: string;
  message: string;
}
