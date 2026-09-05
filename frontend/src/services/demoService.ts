import {
  HealthStatus,
  Merchant,
  AnalyticsOverview,
  Customer,
  Opportunity,
  Strategy,
  ApprovalRequest,
  PolicyConfig,
  Campaign,
  CampaignAction,
  CampaignMetrics,
  AuditEvent,
  AuditChainVerification,
  PaymentSimulationResponse,
  AuthResponse,
  User,
  OnboardingStatus
} from '../types';

const STORAGE_KEY = 'apexgrowth_demo_state_v1';

const INDIAN_FIRST_NAMES = [
  'Aarav', 'Aditi', 'Advait', 'Ananya', 'Arjun', 'Bhavya', 'Chirag', 'Deepak', 'Divya', 'Gaurav',
  'Ishaan', 'Kabir', 'Kavya', 'Manish', 'Meera', 'Neha', 'Nikhil', 'Pooja', 'Pranav', 'Priya',
  'Rahul', 'Rhea', 'Rohan', 'Sakshi', 'Sameer', 'Sanaya', 'Siddharth', 'Sneha', 'Tanvi', 'Varun',
  'Vikram', 'Yash', 'Zoya', 'Aditya', 'Aishwarya', 'Akash', 'Amrita', 'Ankit', 'Archana', 'Dev'
];

const INDIAN_LAST_NAMES = [
  'Sharma', 'Verma', 'Patel', 'Reddy', 'Iyer', 'Nair', 'Menon', 'Gupta', 'Mehta', 'Joshi',
  'Kulkarni', 'Deshmukh', 'Singhania', 'Kapoor', 'Malhotra', 'Bhat', 'Rao', 'Choudhury', 'Sen', 'Das'
];

function pseudoRandom(seed: number) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

function generateDemoCustomers(): Customer[] {
  const customers: Customer[] = [];
  let seed = 42;
  const now = new Date();

  const specs = [
    { seg: 'At-Risk High Value', count: 42, minSpend: 5000, maxSpend: 18000, minOrd: 3, maxOrd: 7, minDays: 48, maxDays: 85, risk: 0.85 },
    { seg: 'Champions', count: 35, minSpend: 8000, maxSpend: 32000, minOrd: 5, maxOrd: 12, minDays: 3, maxDays: 25, risk: 0.15 },
    { seg: 'Loyal Regulars', count: 60, minSpend: 3000, maxSpend: 9500, minOrd: 3, maxOrd: 6, minDays: 10, maxDays: 42, risk: 0.35 },
    { seg: 'Inactive Dormant', count: 45, minSpend: 1500, maxSpend: 6000, minOrd: 1, maxOrd: 3, minDays: 92, maxDays: 180, risk: 0.95 },
    { seg: 'New Customers', count: 20, minSpend: 650, maxSpend: 1800, minOrd: 1, maxOrd: 1, minDays: 2, maxDays: 28, risk: 0.25 },
    { seg: 'Cart Abandoners', count: 18, minSpend: 0, maxSpend: 0, minOrd: 0, maxOrd: 0, minDays: 5, maxDays: 30, risk: 0.65 },
  ];

  let idCounter = 1;
  for (const s of specs) {
    for (let i = 0; i < s.count; i++) {
      const fn = INDIAN_FIRST_NAMES[Math.floor(pseudoRandom(seed++) * INDIAN_FIRST_NAMES.length)];
      const ln = INDIAN_LAST_NAMES[Math.floor(pseudoRandom(seed++) * INDIAN_LAST_NAMES.length)];
      const days = Math.floor(s.minDays + pseudoRandom(seed++) * (s.maxDays - s.minDays + 1));
      const ordCount = Math.floor(s.minOrd + pseudoRandom(seed++) * (s.maxOrd - s.minOrd + 1));
      const spend = ordCount > 0 ? Math.round((s.minSpend + pseudoRandom(seed++) * (s.maxSpend - s.minSpend)) * 100) / 100 : 0;
      const aov = ordCount > 0 ? Math.round((spend / ordCount) * 100) / 100 : 0;
      
      const lastOrderDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
      const firstOrderDate = new Date(now.getTime() - (days + 90) * 24 * 60 * 60 * 1000).toISOString();

      customers.push({
        id: `cust_${idCounter++}`,
        name: `${fn} ${ln}`,
        email: `${fn.toLowerCase()}.${ln.toLowerCase()}${Math.floor(10 + pseudoRandom(seed++) * 890)}@gmail.com`,
        phone: `+91 98${Math.floor(10000000 + pseudoRandom(seed++) * 89999999)}`,
        total_spend: spend,
        order_count: ordCount,
        average_order_value: aov,
        first_order_at: ordCount > 0 ? firstOrderDate : undefined,
        last_order_at: ordCount > 0 ? lastOrderDate : undefined,
        days_since_last_order: days,
        rfm_segment: s.seg,
        churn_risk_score: s.risk,
        created_at: firstOrderDate
      });
    }
  }

  return customers;
}

interface DemoState {
  user: User;
  merchant: Merchant;
  policy: PolicyConfig;
  customers: Customer[];
  opportunities: Opportunity[];
  strategies: Record<string, Strategy>;
  approvalRequests: Record<string, ApprovalRequest>;
  campaigns: Record<string, Campaign>;
  campaignActions: Record<string, CampaignAction[]>;
  auditEvents: AuditEvent[];
}

function getInitialDemoState(): DemoState {
  const user: User = {
    id: 'user_artisan_001',
    email: 'merchant@artisanroasters.in',
    full_name: 'Artisan Founder',
    is_onboarded: true,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString()
  };

  const merchant: Merchant = {
    id: 'merch_artisan_001',
    user_id: user.id,
    name: 'Artisan Roasters Co.',
    business_type: 'D2C Specialty Coffee & Brewing Gear',
    category: 'Food & Beverage',
    website: 'https://artisanroasters.in',
    currency: 'INR',
    contact_email: 'founder@artisanroasters.in',
    is_demo: true,
    is_razorpay_connected: true,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    settings: { timezone: 'Asia/Kolkata', tax_rate: 0.05 }
  };

  const policy: PolicyConfig = {
    id: 'pol_artisan_001',
    merchant_id: merchant.id,
    max_discount_percent: 20.0,
    max_campaign_audience: 500,
    max_budget_inr: 50000.0,
    cooldown_days_per_customer: 14,
    require_manual_approval_above_inr: 5000.0,
    updated_at: new Date().toISOString()
  };

  const customers = generateDemoCustomers();
  const atRiskCohort = customers.filter(c => c.rfm_segment === 'At-Risk High Value');

  const oppId = 'opp_artisan_winback_001';
  const stratId = 'strat_artisan_winback_001';
  const apprId = 'appr_artisan_winback_001';

  const approvalReq: ApprovalRequest = {
    id: apprId,
    strategy_id: stratId,
    status: 'pending_approval',
    policy_checks_passed: true,
    policy_validation_report: {
      passed: true,
      violations: [],
      checks: {
        discount_within_policy: true,
        audience_within_policy: true,
        budget_within_policy: true,
        cooldown_compliant: true
      },
      requires_manual_approval: true,
      validated_at: new Date().toISOString()
    },
    requested_at: new Date().toISOString()
  };

  const strategy: Strategy = {
    id: stratId,
    opportunity_id: oppId,
    name: 'Exclusive 15% Winback via Razorpay Smart Link',
    action_type: 'RAZORPAY_PAYMENT_LINK_DISCOUNT',
    proposed_discount_percent: 15.0,
    validity_hours: 72,
    min_order_amount: 899.0,
    target_audience_count: 42,
    estimated_campaign_cost: 5496.0,
    estimated_gross_revenue: 36641.0,
    estimated_net_lift: 31145.0,
    projected_roi: 6.67,
    why_explanation: {
      core_insight: '42 high-spending customers (avg AOV ₹1,789) have stopped ordering over the past 48-85 days. A targeted 15% incentive delivered via Razorpay payment links re-engages them with high conversion confidence.',
      data_evidence: {
        segment: 'At-Risk High Value',
        target_cohort_size: 42,
        historical_spend_inr: 441000.0,
        historical_aov_inr: 1789.0,
        average_dormancy_days: 62.4,
        sample_customers: atRiskCohort.slice(0, 4).map(c => ({
          name: c.name,
          email: c.email,
          total_spend: c.total_spend,
          days_inactive: c.days_since_last_order
        }))
      },
      financial_breakdown: {
        proposed_discount_pct: 15.0,
        estimated_gross_revenue: 36641.0,
        estimated_incentive_cost: 5496.0,
        estimated_net_revenue_lift: 31145.0,
        projected_roi_multiplier: 6.67
      },
      selection_rationale: 'Incentive is bounded by 20% max discount guardrail and 50,000 INR budget cap. Delivers 6.67x expected return on incentive spend.',
      grounded_in_db: true
    },
    approval_request: approvalReq,
    created_at: new Date().toISOString()
  };

  const opportunity: Opportunity = {
    id: oppId,
    merchant_id: merchant.id,
    type: 'INACTIVE_RETENTION',
    title: 'High-Value Inactive Customer Winback',
    summary: '42 high-spending customers (historical AOV ₹1,789) have become inactive in the last 48-85 days. Direct targeted incentive via Razorpay Payment Link can recover dormant revenue.',
    target_segment: 'At-Risk High Value',
    target_customer_count: 42,
    total_historical_spend: 441000.0,
    average_customer_aov: 1789.0,
    estimated_recoverable_revenue: 36641.0,
    urgency: 'HIGH',
    status: 'DISCOVERED',
    evidence: {
      segment_name: 'At-Risk High Value',
      dormant_days_average: 62.4,
      churn_probability: 0.85,
      sample_customers: atRiskCohort.slice(0, 4).map(c => ({
        name: c.name,
        email: c.email,
        spend: c.total_spend,
        days_inactive: c.days_since_last_order
      }))
    },
    strategy: strategy,
    created_at: new Date().toISOString()
  };

  const auditEvents: AuditEvent[] = [
    {
      id: 'aud_001',
      merchant_id: merchant.id,
      sequence_number: 1,
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
      actor_type: 'SYSTEM',
      actor_id: 'seed_engine',
      action: 'SYSTEM_DATABASE_SEEDED',
      target_type: 'merchant',
      target_id: merchant.id,
      summary: 'Database initialized with 220 customers, 600+ orders, and policy rules.',
      details: { customer_count: 220, merchant_name: merchant.name, razorpay_mode: 'test_mode' },
      policy_passed: true,
      prev_hash: '0000000000000000000000000000000000000000000000000000000000000000',
      current_hash: '7a9f8e3d2c1b0a9f8e3d2c1b0a9f8e3d2c1b0a9f8e3d2c1b0a9f8e3d2c1b0a9f'
    },
    {
      id: 'aud_002',
      merchant_id: merchant.id,
      sequence_number: 2,
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      actor_type: 'AGENT',
      actor_id: 'growth_agent',
      action: 'OPPORTUNITY_DISCOVERED',
      target_type: 'opportunity',
      target_id: oppId,
      summary: 'Discovered high-value inactive cohort: 42 customers representing ₹4,41,000.00 historic spend.',
      details: { target_segment: 'At-Risk High Value', customer_count: 42, estimated_recoverable: 36641.0 },
      policy_passed: true,
      prev_hash: '7a9f8e3d2c1b0a9f8e3d2c1b0a9f8e3d2c1b0a9f8e3d2c1b0a9f8e3d2c1b0a9f',
      current_hash: 'e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7'
    }
  ];

  return {
    user,
    merchant,
    policy,
    customers,
    opportunities: [opportunity],
    strategies: { [stratId]: strategy },
    approvalRequests: { [apprId]: approvalReq },
    campaigns: {},
    campaignActions: {},
    auditEvents
  };
}

class DemoStore {
  private state: DemoState;

  constructor() {
    this.state = this.load();
  }

  private load(): DemoState {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    const init = getInitialDemoState();
    this.save(init);
    return init;
  }

  private save(state: DemoState) {
    this.state = state;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }

  reset(): DemoState {
    const fresh = getInitialDemoState();
    this.save(fresh);
    return fresh;
  }

  getState(): DemoState {
    return this.state;
  }

  // --- Auth ---
  login(email: string): AuthResponse {
    const isArtisan = email.toLowerCase().includes('artisan') || email.toLowerCase().includes('merchant');
    const user: User = isArtisan ? this.state.user : {
      id: `user_${Date.now()}`,
      email: email.trim().toLowerCase(),
      full_name: email.split('@')[0].replace('.', ' '),
      is_onboarded: true,
      created_at: new Date().toISOString()
    };
    const token = `demo_token_${user.id}_${Date.now()}`;
    return { token, user, merchant: this.state.merchant };
  }

  demoLogin(): AuthResponse {
    const token = `demo_token_artisan_${Date.now()}`;
    return { token, user: this.state.user, merchant: this.state.merchant };
  }

  getMe(): AuthResponse {
    return { token: 'demo_session_active', user: this.state.user, merchant: this.state.merchant };
  }

  // --- Analytics ---
  getAnalyticsOverview(): AnalyticsOverview {
    const atRisk = this.state.customers.filter(c => c.rfm_segment === 'At-Risk High Value' || c.rfm_segment === 'Inactive Dormant');
    const atRiskRev = atRisk.reduce((acc, c) => acc + c.average_order_value, 0);

    const segmentsMap: Record<string, { count: number; spend: number; days: number }> = {};
    for (const c of this.state.customers) {
      if (!segmentsMap[c.rfm_segment]) {
        segmentsMap[c.rfm_segment] = { count: 0, spend: 0, days: 0 };
      }
      segmentsMap[c.rfm_segment].count += 1;
      segmentsMap[c.rfm_segment].spend += c.total_spend;
      segmentsMap[c.rfm_segment].days += c.days_since_last_order;
    }

    const segments = Object.entries(segmentsMap).map(([seg, data]) => ({
      segment: seg,
      customer_count: data.count,
      total_spend: Math.round(data.spend),
      average_order_value: data.count > 0 ? Math.round(data.spend / data.count) : 0,
      average_days_inactive: data.count > 0 ? Math.round((data.days / data.count) * 10) / 10 : 0,
      at_risk_revenue: (seg === 'At-Risk High Value' || seg === 'Inactive Dormant') ? Math.round(data.spend * 0.2) : 0
    })).sort((a, b) => b.customer_count - a.customer_count);

    return {
      total_revenue_30d: 482450.0,
      revenue_trend: {
        current_30d: 482450.0,
        previous_30d: 420100.0,
        growth_percent: 14.84
      },
      total_customers: this.state.customers.length,
      active_customers_30d: 133,
      at_risk_customers_count: atRisk.length,
      at_risk_revenue_inr: Math.round(atRiskRev * 100) / 100,
      average_order_value: 1420.0,
      total_orders_30d: 340,
      payment_success_rate: 98.4,
      segments,
      currency: 'INR'
    };
  }

  // --- Customers ---
  getCustomers(segment?: string, limit: number = 50): Customer[] {
    let list = this.state.customers;
    if (segment) {
      list = list.filter(c => c.rfm_segment.toLowerCase() === segment.toLowerCase());
    }
    return list.slice(0, limit);
  }

  // --- Opportunities & Agent ---
  getCurrentOpportunity(): Opportunity {
    return this.state.opportunities[0];
  }

  listOpportunities(): Opportunity[] {
    return this.state.opportunities;
  }

  proposeStrategy(opportunityId?: string, customDiscount?: number, customAudience?: number) {
    const opp = this.getCurrentOpportunity();
    const discount = customDiscount !== undefined ? customDiscount : 15.0;
    const audience = customAudience !== undefined ? customAudience : 42;

    const grossRev = Math.round(audience * opp.average_customer_aov * 0.48);
    const cost = Math.round(grossRev * (discount / 100));
    const netLift = grossRev - cost;
    const roi = cost > 0 ? Math.round((netLift / cost) * 100) / 100 : 0;

    const stratId = 'strat_artisan_winback_001';
    const apprId = 'appr_artisan_winback_001';

    const appr: ApprovalRequest = {
      id: apprId,
      strategy_id: stratId,
      status: 'pending_approval',
      policy_checks_passed: discount <= this.state.policy.max_discount_percent,
      policy_validation_report: {
        passed: discount <= this.state.policy.max_discount_percent,
        violations: discount > this.state.policy.max_discount_percent ? [`Discount ${discount}% exceeds policy cap ${this.state.policy.max_discount_percent}%`] : [],
        checks: {
          discount_within_policy: discount <= this.state.policy.max_discount_percent,
          audience_within_policy: audience <= this.state.policy.max_campaign_audience,
          budget_within_policy: cost <= this.state.policy.max_budget_inr,
          cooldown_compliant: true
        },
        requires_manual_approval: true,
        validated_at: new Date().toISOString()
      },
      requested_at: new Date().toISOString()
    };

    const strat: Strategy = {
      id: stratId,
      opportunity_id: opp.id,
      name: `Exclusive ${discount}% Winback via Razorpay Smart Link`,
      action_type: 'RAZORPAY_PAYMENT_LINK_DISCOUNT',
      proposed_discount_percent: discount,
      validity_hours: 72,
      min_order_amount: 899.0,
      target_audience_count: audience,
      estimated_campaign_cost: cost,
      estimated_gross_revenue: grossRev,
      estimated_net_lift: netLift,
      projected_roi: roi,
      why_explanation: {
        core_insight: `${audience} high-spending customers (avg AOV ₹${opp.average_customer_aov}) have stopped ordering. A targeted ${discount}% incentive via Razorpay payment links recovers dormant revenue.`,
        data_evidence: {
          segment: opp.target_segment,
          target_cohort_size: audience,
          historical_spend_inr: opp.total_historical_spend,
          historical_aov_inr: opp.average_customer_aov,
          average_dormancy_days: 62.4,
          sample_customers: this.state.customers.filter(c => c.rfm_segment === opp.target_segment).slice(0, 4).map(c => ({
            name: c.name,
            email: c.email,
            total_spend: c.total_spend,
            days_inactive: c.days_since_last_order
          }))
        },
        financial_breakdown: {
          proposed_discount_pct: discount,
          estimated_gross_revenue: grossRev,
          estimated_incentive_cost: cost,
          estimated_net_revenue_lift: netLift,
          projected_roi_multiplier: roi
        },
        selection_rationale: `Bounded by ${this.state.policy.max_discount_percent}% policy cap. Expected net lift: ₹${netLift.toLocaleString('en-IN')}.`,
        grounded_in_db: true
      },
      approval_request: appr,
      created_at: new Date().toISOString()
    };

    opp.strategy = strat;
    this.state.strategies[stratId] = strat;
    this.state.approvalRequests[apprId] = appr;
    this.save(this.state);

    return {
      opportunity: opp,
      strategy: strat,
      approval_request: appr,
      policy_validation: appr.policy_validation_report
    };
  }

  getApprovalRequest(id: string): ApprovalRequest {
    return this.state.approvalRequests[id] || this.state.opportunities[0].strategy?.approval_request!;
  }

  decideApproval(id: string, approved: boolean, decidedBy: string = 'merchant_founder', rejectionReason?: string): ApprovalRequest {
    const appr = this.getApprovalRequest(id);
    appr.status = approved ? 'approved' : 'rejected';
    appr.decided_at = new Date().toISOString();
    appr.decided_by = decidedBy;
    appr.rejection_reason = rejectionReason;

    // Add audit event
    const prevHash = this.state.auditEvents[this.state.auditEvents.length - 1].current_hash;
    const newEvent: AuditEvent = {
      id: `aud_${Date.now()}`,
      merchant_id: this.state.merchant.id,
      sequence_number: this.state.auditEvents.length + 1,
      timestamp: new Date().toISOString(),
      actor_type: 'MERCHANT',
      actor_id: decidedBy,
      action: approved ? 'STRATEGY_APPROVED' : 'STRATEGY_REJECTED',
      target_type: 'approval_request',
      target_id: id,
      summary: approved ? 'Merchant approved 15% discount campaign for 42 high-value customers.' : `Merchant rejected campaign: ${rejectionReason || 'No reason provided'}`,
      details: { approval_id: id, approved, decided_by: decidedBy },
      policy_passed: true,
      prev_hash: prevHash,
      current_hash: (Math.sin(Date.now()) * 1e16).toString(16)
    };
    this.state.auditEvents.push(newEvent);

    this.save(this.state);
    return appr;
  }

  // --- Policy ---
  getPolicy(): PolicyConfig {
    return this.state.policy;
  }

  updatePolicy(updated: Partial<PolicyConfig>): PolicyConfig {
    this.state.policy = {
      ...this.state.policy,
      ...updated,
      updated_at: new Date().toISOString()
    };
    this.save(this.state);
    return this.state.policy;
  }

  // --- Campaigns ---
  executeCampaign(approvalRequestId: string): Campaign {
    const appr = this.getApprovalRequest(approvalRequestId);
    appr.status = 'executing';

    const campaignId = 'camp_artisan_winback_001';
    const atRisk = this.state.customers.filter(c => c.rfm_segment === 'At-Risk High Value');

    const actions: CampaignAction[] = atRisk.map((c, idx) => {
      const orig = Math.round(c.average_order_value || 1499);
      const disc = Math.round(orig * 0.15);
      const finalAmt = orig - disc;
      const shortCode = (1000 + idx).toString();
      return {
        id: `act_${idx + 1}`,
        campaign_id: campaignId,
        customer_id: c.id,
        razorpay_payment_link_id: `plink_test_${shortCode}`,
        razorpay_short_url: `https://rzp.io/i/winback_${shortCode}`,
        original_amount: orig,
        discount_amount: disc,
        final_amount: finalAmt,
        status: idx < 8 ? 'paid' : (idx < 15 ? 'clicked' : 'sent'),
        created_at: new Date().toISOString(),
        executed_at: new Date().toISOString(),
        paid_at: idx < 8 ? new Date().toISOString() : undefined
      };
    });

    const paidActions = actions.filter(a => a.status === 'paid');
    const actualGross = paidActions.reduce((acc, a) => acc + a.original_amount, 0);
    const actualIncentive = paidActions.reduce((acc, a) => acc + a.discount_amount, 0);
    const actualNet = actualGross - actualIncentive;
    const roi = actualIncentive > 0 ? Math.round((actualNet / actualIncentive) * 100) / 100 : 0;

    const campaign: Campaign = {
      id: campaignId,
      merchant_id: this.state.merchant.id,
      approval_request_id: approvalRequestId,
      name: 'High-Value Inactive Customer Winback',
      status: 'active',
      execution_mode: 'razorpay_test',
      target_count: atRisk.length,
      links_created_count: atRisk.length,
      conversions_count: paidActions.length,
      budget_cap: 5496.0,
      actual_incentive_spent: actualIncentive,
      actual_revenue_generated: actualGross,
      net_revenue_lift: actualNet,
      realized_roi: roi,
      execution_details: {
        channel: 'WHATSAPP_RAZORPAY_LINK',
        provider: 'Razorpay Payment Links API (Test Mode)',
        discount_type: 'FIXED_PERCENTAGE',
        discount_value: 15.0
      },
      created_at: new Date().toISOString()
    };

    this.state.campaigns[campaignId] = campaign;
    this.state.campaignActions[campaignId] = actions;
    appr.status = 'completed';

    // Audit event
    const prevHash = this.state.auditEvents[this.state.auditEvents.length - 1].current_hash;
    this.state.auditEvents.push({
      id: `aud_${Date.now()}`,
      merchant_id: this.state.merchant.id,
      sequence_number: this.state.auditEvents.length + 1,
      timestamp: new Date().toISOString(),
      actor_type: 'AGENT',
      actor_id: 'campaign_executor',
      action: 'CAMPAIGN_EXECUTED',
      target_type: 'campaign',
      target_id: campaignId,
      summary: `Dispatched 42 personalized Razorpay Payment Links with 15% discount.`,
      details: { campaign_id: campaignId, target_count: 42, mode: 'razorpay_test' },
      policy_passed: true,
      prev_hash: prevHash,
      current_hash: (Math.sin(Date.now() + 1) * 1e16).toString(16)
    });

    this.save(this.state);
    return campaign;
  }

  getCampaign(id: string): Campaign {
    if (this.state.campaigns[id]) {
      return this.state.campaigns[id];
    }
    // Return or auto-create default active campaign
    return this.executeCampaign('appr_artisan_winback_001');
  }

  getCampaignActions(campaignId: string, status?: string, limit: number = 100): CampaignAction[] {
    let acts = this.state.campaignActions[campaignId];
    if (!acts) {
      this.getCampaign(campaignId);
      acts = this.state.campaignActions[campaignId] || [];
    }
    if (status) {
      acts = acts.filter(a => a.status === status);
    }
    return acts.slice(0, limit);
  }

  getCampaignMetrics(campaignId: string): CampaignMetrics {
    const c = this.getCampaign(campaignId);
    const acts = this.getCampaignActions(campaignId);
    const paid = acts.filter(a => a.status === 'paid');
    const convRate = acts.length > 0 ? Math.round((paid.length / acts.length) * 1000) / 10 : 0;

    return {
      campaign_id: campaignId,
      status: c.status,
      execution_mode: 'Razorpay Test Mode',
      target_audience: c.target_count,
      links_created: c.links_created_count,
      conversions_count: paid.length,
      conversion_rate_percent: convRate,
      projected_gross_revenue: 36641.0,
      projected_campaign_cost: 5496.0,
      projected_net_lift: 31145.0,
      projected_roi: 6.67,
      actual_gross_revenue: c.actual_revenue_generated,
      actual_campaign_cost: c.actual_incentive_spent,
      actual_net_lift: c.net_revenue_lift,
      actual_roi: c.realized_roi,
      currency: 'INR'
    };
  }

  // --- Payment Simulator ---
  simulatePayment(actionId: string, eventType: 'SUCCESS' | 'FAILURE' | 'EXPIRED', paymentMethod: string = 'upi', failureReason?: string): PaymentSimulationResponse {
    let campaignId = 'camp_artisan_winback_001';
    let targetAction: CampaignAction | undefined;

    for (const [cid, acts] of Object.entries(this.state.campaignActions)) {
      const found = acts.find(a => a.id === actionId);
      if (found) {
        campaignId = cid;
        targetAction = found;
        break;
      }
    }

    if (!targetAction) {
      const acts = this.getCampaignActions(campaignId);
      targetAction = acts.find(a => a.id === actionId) || acts[0];
    }

    if (eventType === 'SUCCESS') {
      targetAction.status = 'paid';
      targetAction.paid_at = new Date().toISOString();
      const campaign = this.state.campaigns[campaignId];
      if (campaign) {
        campaign.conversions_count += 1;
        campaign.actual_revenue_generated += targetAction.original_amount;
        campaign.actual_incentive_spent += targetAction.discount_amount;
        campaign.net_revenue_lift = campaign.actual_revenue_generated - campaign.actual_incentive_spent;
        campaign.realized_roi = campaign.actual_incentive_spent > 0
          ? Math.round((campaign.net_revenue_lift / campaign.actual_incentive_spent) * 100) / 100
          : 0;
      }

      // Add audit event
      const prevHash = this.state.auditEvents[this.state.auditEvents.length - 1].current_hash;
      this.state.auditEvents.push({
        id: `aud_${Date.now()}`,
        merchant_id: this.state.merchant.id,
        sequence_number: this.state.auditEvents.length + 1,
        timestamp: new Date().toISOString(),
        actor_type: 'RAZORPAY_WEBHOOK',
        actor_id: 'webhook_processor',
        action: 'PAYMENT_CAPTURED_AND_ATTRIBUTED',
        target_type: 'payment',
        target_id: `pay_test_${Date.now().toString(16)}`,
        summary: `Payment of ₹${targetAction.final_amount.toFixed(2)} captured via ${paymentMethod.toUpperCase()}. Revenue attributed to campaign.`,
        details: { action_id: actionId, method: paymentMethod, amount: targetAction.final_amount },
        policy_passed: true,
        prev_hash: prevHash,
        current_hash: (Math.sin(Date.now() + 2) * 1e16).toString(16)
      });
    } else {
      targetAction.status = eventType === 'FAILURE' ? 'failed' : 'expired';
      targetAction.failure_reason = failureReason || 'Card payment declined by issuer simulator.';
    }

    this.save(this.state);

    return {
      status: 'ok',
      action_id: actionId,
      event_type: eventType,
      payment_id: eventType === 'SUCCESS' ? `pay_sim_${Date.now()}` : undefined,
      attributed_revenue: eventType === 'SUCCESS' ? targetAction.original_amount : 0,
      campaign_id: campaignId,
      message: eventType === 'SUCCESS' ? 'Payment captured and revenue attribution updated successfully.' : `Payment simulation status updated to ${eventType.toLowerCase()}.`
    };
  }

  // --- Audit ---
  getAuditEvents(limit: number = 100): AuditEvent[] {
    return this.state.auditEvents.slice(-limit).reverse();
  }

  verifyAuditChain(): AuditChainVerification {
    return {
      is_valid: true,
      total_events: this.state.auditEvents.length,
      genesis_hash: this.state.auditEvents[0]?.current_hash,
      latest_hash: this.state.auditEvents[this.state.auditEvents.length - 1]?.current_hash,
      verified_at: new Date().toISOString()
    };
  }

  // --- Onboarding ---
  getOnboardingStatus(): OnboardingStatus {
    return {
      step: 5,
      is_completed: true,
      merchant: this.state.merchant
    };
  }

  setupBusiness(name: string, category: string, website?: string): Merchant {
    this.state.merchant.name = name;
    this.state.merchant.category = category;
    if (website) this.state.merchant.website = website;
    this.save(this.state);
    return this.state.merchant;
  }

  connectRazorpay(keyId?: string, keySecret?: string, mode: string = 'test'): Merchant {
    this.state.merchant.is_razorpay_connected = true;
    this.save(this.state);
    return this.state.merchant;
  }

  syncOnboardingData() {
    return { status: 'success', message: 'Synced 220 customer records and 600+ orders from Razorpay Test Mode.' };
  }

  completeOnboarding(): User {
    this.state.user.is_onboarded = true;
    this.save(this.state);
    return this.state.user;
  }
}

export const demoStore = new DemoStore();
