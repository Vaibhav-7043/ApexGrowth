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

const API_BASE = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('apexgrowth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
      ...(options?.headers || {})
    }
  });

  if (!res.ok) {
    let errorDetail = res.statusText;
    try {
      const data = await res.json();
      errorDetail = data.detail || errorDetail;
    } catch {
      // ignore
    }
    throw new Error(errorDetail);
  }

  return res.json();
}

export const api = {
  // Auth API
  register: (fullName: string, email: string, password: string) => {
    return fetchJson<AuthResponse>(`${API_BASE}/auth/register`, {
      method: 'POST',
      body: JSON.stringify({ full_name: fullName, email, password })
    });
  },

  login: (email: string, password: string) => {
    return fetchJson<AuthResponse>(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  },

  demoLogin: () => {
    return fetchJson<AuthResponse>(`${API_BASE}/auth/demo-login`, {
      method: 'POST'
    });
  },

  getMe: () => fetchJson<AuthResponse>(`${API_BASE}/auth/me`),

  // Onboarding API
  getOnboardingStatus: () => fetchJson<OnboardingStatus>(`${API_BASE}/onboarding/status`),

  setupBusiness: (name: string, category: string, website?: string) => {
    return fetchJson<Merchant>(`${API_BASE}/onboarding/business`, {
      method: 'POST',
      body: JSON.stringify({ name, category, website })
    });
  },

  connectRazorpay: (keyId?: string, keySecret?: string, mode: string = 'test') => {
    return fetchJson<Merchant>(`${API_BASE}/onboarding/connect-razorpay`, {
      method: 'POST',
      body: JSON.stringify({ key_id: keyId, key_secret: keySecret, mode })
    });
  },

  syncOnboardingData: () => {
    return fetchJson<{ status: string; message: string }>(`${API_BASE}/onboarding/sync`, {
      method: 'POST'
    });
  },

  completeOnboarding: () => {
    return fetchJson<User>(`${API_BASE}/onboarding/complete`, {
      method: 'POST'
    });
  },

  // Existing Core Engine API
  getHealth: () => fetchJson<HealthStatus>(`${API_BASE}/health`),
  
  getMerchant: () => fetchJson<Merchant>(`${API_BASE}/merchants/current`),
  
  getAnalyticsOverview: () => fetchJson<AnalyticsOverview>(`${API_BASE}/analytics/overview`),
  
  getCustomers: (segment?: string, limit: number = 50) => {
    const params = new URLSearchParams();
    if (segment) params.append('segment', segment);
    params.append('limit', limit.toString());
    return fetchJson<Customer[]>(`${API_BASE}/customers?${params.toString()}`);
  },
  
  getCurrentOpportunity: () => fetchJson<Opportunity>(`${API_BASE}/opportunities/current`),
  
  listOpportunities: () => fetchJson<Opportunity[]>(`${API_BASE}/opportunities`),
  
  proposeStrategy: (opportunityId?: string, customDiscount?: number, customAudience?: number) => {
    return fetchJson<{
      opportunity: Opportunity;
      strategy: Strategy;
      approval_request: ApprovalRequest;
      policy_validation: any;
    }>(`${API_BASE}/agent/propose-strategy`, {
      method: 'POST',
      body: JSON.stringify({
        opportunity_id: opportunityId,
        custom_discount_override: customDiscount,
        custom_audience_override: customAudience
      })
    });
  },
  
  getApprovalRequest: (id: string) => fetchJson<ApprovalRequest>(`${API_BASE}/approvals/${id}`),
  
  decideApproval: (id: string, approved: boolean, decidedBy: string = 'merchant_founder', rejectionReason?: string) => {
    return fetchJson<ApprovalRequest>(`${API_BASE}/approvals/${id}/decide`, {
      method: 'POST',
      body: JSON.stringify({
        approved,
        decided_by: decidedBy,
        rejection_reason: rejectionReason
      })
    });
  },
  
  getPolicy: () => fetchJson<PolicyConfig>(`${API_BASE}/policies/current`),
  
  updatePolicy: (policy: Partial<PolicyConfig>) => {
    return fetchJson<PolicyConfig>(`${API_BASE}/policies/current`, {
      method: 'PUT',
      body: JSON.stringify(policy)
    });
  },
  
  executeCampaign: (approvalRequestId: string, idempotencyKey?: string) => {
    return fetchJson<Campaign>(`${API_BASE}/campaigns/execute`, {
      method: 'POST',
      body: JSON.stringify({
        approval_request_id: approvalRequestId,
        idempotency_key: idempotencyKey
      })
    });
  },
  
  getCampaign: (id: string) => fetchJson<Campaign>(`${API_BASE}/campaigns/${id}`),
  
  getCampaignActions: (campaignId: string, status?: string, limit: number = 100) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    params.append('limit', limit.toString());
    return fetchJson<CampaignAction[]>(`${API_BASE}/campaigns/${campaignId}/actions?${params.toString()}`);
  },
  
  getCampaignMetrics: (campaignId: string) => fetchJson<CampaignMetrics>(`${API_BASE}/campaigns/${campaignId}/metrics`),
  
  simulatePayment: (actionId: string, eventType: 'SUCCESS' | 'FAILURE' | 'EXPIRED', paymentMethod: string = 'upi', failureReason?: string) => {
    return fetchJson<PaymentSimulationResponse>(`${API_BASE}/sandbox/payments/simulate`, {
      method: 'POST',
      body: JSON.stringify({
        action_id: actionId,
        event_type: eventType,
        payment_method: paymentMethod,
        failure_reason: failureReason
      })
    });
  },
  
  getAuditEvents: (limit: number = 100) => fetchJson<AuditEvent[]>(`${API_BASE}/audit/events?limit=${limit}`),
  
  verifyAuditChain: () => fetchJson<AuditChainVerification>(`${API_BASE}/audit/verify`),
  
  resetAndSeedDb: () => fetchJson<{ status: string; message: string; merchant_id: string }>(`${API_BASE}/seed/reset`, {
    method: 'POST'
  })
};
