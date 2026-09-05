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
import { demoStore } from './demoService';

const rawApiBase = import.meta.env.VITE_API_BASE_URL || '';
const API_BASE = rawApiBase ? `${rawApiBase.replace(/\/+$/, '')}/api` : '/api';

export const isDemoMode = (): boolean => {
  if (import.meta.env.VITE_DEMO_MODE === 'true') return true;
  if (typeof window !== 'undefined') {
    if (window.location.hostname.includes('github.io')) return true;
    if (localStorage.getItem('apexgrowth_demo_mode') === 'true') return true;
  }
  return false;
};

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('apexgrowth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchJson<T>(url: string, options?: RequestInit, fallback?: () => T): Promise<T> {
  if (isDemoMode() && fallback) {
    return Promise.resolve(fallback());
  }

  try {
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

    return await res.json();
  } catch (err: any) {
    if (fallback) {
      console.warn(`[ApexGrowth] Network request to ${url} unavailable, using interactive demo fallback:`, err.message);
      return Promise.resolve(fallback());
    }
    throw err;
  }
}

export const api = {
  // Auth API
  register: (fullName: string, email: string, password: string) => {
    return fetchJson<AuthResponse>(
      `${API_BASE}/auth/register`,
      {
        method: 'POST',
        body: JSON.stringify({ full_name: fullName, email, password })
      },
      () => demoStore.login(email)
    );
  },

  login: (email: string, password: string) => {
    return fetchJson<AuthResponse>(
      `${API_BASE}/auth/login`,
      {
        method: 'POST',
        body: JSON.stringify({ email, password })
      },
      () => demoStore.login(email)
    );
  },

  demoLogin: () => {
    return fetchJson<AuthResponse>(
      `${API_BASE}/auth/demo-login`,
      { method: 'POST' },
      () => demoStore.demoLogin()
    );
  },

  getMe: () => {
    return fetchJson<AuthResponse>(
      `${API_BASE}/auth/me`,
      undefined,
      () => demoStore.getMe()
    );
  },

  // Onboarding API
  getOnboardingStatus: () => {
    return fetchJson<OnboardingStatus>(
      `${API_BASE}/onboarding/status`,
      undefined,
      () => demoStore.getOnboardingStatus()
    );
  },

  setupBusiness: (name: string, category: string, website?: string) => {
    return fetchJson<Merchant>(
      `${API_BASE}/onboarding/business`,
      {
        method: 'POST',
        body: JSON.stringify({ name, category, website })
      },
      () => demoStore.setupBusiness(name, category, website)
    );
  },

  connectRazorpay: (keyId?: string, keySecret?: string, mode: string = 'test') => {
    return fetchJson<Merchant>(
      `${API_BASE}/onboarding/connect-razorpay`,
      {
        method: 'POST',
        body: JSON.stringify({ key_id: keyId, key_secret: keySecret, mode })
      },
      () => demoStore.connectRazorpay(keyId, keySecret, mode)
    );
  },

  syncOnboardingData: () => {
    return fetchJson<{ status: string; message: string }>(
      `${API_BASE}/onboarding/sync`,
      { method: 'POST' },
      () => demoStore.syncOnboardingData()
    );
  },

  completeOnboarding: () => {
    return fetchJson<User>(
      `${API_BASE}/onboarding/complete`,
      { method: 'POST' },
      () => demoStore.completeOnboarding()
    );
  },

  // Core Engine API
  getHealth: () => {
    return fetchJson<HealthStatus>(
      `${API_BASE}/health`,
      undefined,
      () => ({
        status: 'ok',
        database: 'healthy',
        environment: 'demo_mode',
        llm_provider: 'deterministic_engine',
        razorpay_mode: 'razorpay_test'
      })
    );
  },
  
  getMerchant: () => {
    return fetchJson<Merchant>(
      `${API_BASE}/merchants/current`,
      undefined,
      () => demoStore.getState().merchant
    );
  },
  
  getAnalyticsOverview: () => {
    return fetchJson<AnalyticsOverview>(
      `${API_BASE}/analytics/overview`,
      undefined,
      () => demoStore.getAnalyticsOverview()
    );
  },
  
  getCustomers: (segment?: string, limit: number = 50) => {
    const params = new URLSearchParams();
    if (segment) params.append('segment', segment);
    params.append('limit', limit.toString());
    return fetchJson<Customer[]>(
      `${API_BASE}/customers?${params.toString()}`,
      undefined,
      () => demoStore.getCustomers(segment, limit)
    );
  },
  
  getCurrentOpportunity: () => {
    return fetchJson<Opportunity>(
      `${API_BASE}/opportunities/current`,
      undefined,
      () => demoStore.getCurrentOpportunity()
    );
  },
  
  listOpportunities: () => {
    return fetchJson<Opportunity[]>(
      `${API_BASE}/opportunities`,
      undefined,
      () => demoStore.listOpportunities()
    );
  },
  
  proposeStrategy: (opportunityId?: string, customDiscount?: number, customAudience?: number) => {
    return fetchJson<{
      opportunity: Opportunity;
      strategy: Strategy;
      approval_request: ApprovalRequest;
      policy_validation: any;
    }>(
      `${API_BASE}/agent/propose-strategy`,
      {
        method: 'POST',
        body: JSON.stringify({
          opportunity_id: opportunityId,
          custom_discount_override: customDiscount,
          custom_audience_override: customAudience
        })
      },
      () => demoStore.proposeStrategy(opportunityId, customDiscount, customAudience)
    );
  },
  
  getApprovalRequest: (id: string) => {
    return fetchJson<ApprovalRequest>(
      `${API_BASE}/approvals/${id}`,
      undefined,
      () => demoStore.getApprovalRequest(id)
    );
  },
  
  decideApproval: (id: string, approved: boolean, decidedBy: string = 'merchant_founder', rejectionReason?: string) => {
    return fetchJson<ApprovalRequest>(
      `${API_BASE}/approvals/${id}/decide`,
      {
        method: 'POST',
        body: JSON.stringify({
          approved,
          decided_by: decidedBy,
          rejection_reason: rejectionReason
        })
      },
      () => demoStore.decideApproval(id, approved, decidedBy, rejectionReason)
    );
  },
  
  getPolicy: () => {
    return fetchJson<PolicyConfig>(
      `${API_BASE}/policies/current`,
      undefined,
      () => demoStore.getPolicy()
    );
  },
  
  updatePolicy: (policy: Partial<PolicyConfig>) => {
    return fetchJson<PolicyConfig>(
      `${API_BASE}/policies/current`,
      {
        method: 'PUT',
        body: JSON.stringify(policy)
      },
      () => demoStore.updatePolicy(policy)
    );
  },
  
  executeCampaign: (approvalRequestId: string, idempotencyKey?: string) => {
    return fetchJson<Campaign>(
      `${API_BASE}/campaigns/execute`,
      {
        method: 'POST',
        body: JSON.stringify({
          approval_request_id: approvalRequestId,
          idempotency_key: idempotencyKey
        })
      },
      () => demoStore.executeCampaign(approvalRequestId)
    );
  },
  
  getCampaign: (id: string) => {
    return fetchJson<Campaign>(
      `${API_BASE}/campaigns/${id}`,
      undefined,
      () => demoStore.getCampaign(id)
    );
  },
  
  getCampaignActions: (campaignId: string, status?: string, limit: number = 100) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    params.append('limit', limit.toString());
    return fetchJson<CampaignAction[]>(
      `${API_BASE}/campaigns/${campaignId}/actions?${params.toString()}`,
      undefined,
      () => demoStore.getCampaignActions(campaignId, status, limit)
    );
  },
  
  getCampaignMetrics: (campaignId: string) => {
    return fetchJson<CampaignMetrics>(
      `${API_BASE}/campaigns/${campaignId}/metrics`,
      undefined,
      () => demoStore.getCampaignMetrics(campaignId)
    );
  },
  
  simulatePayment: (actionId: string, eventType: 'SUCCESS' | 'FAILURE' | 'EXPIRED', paymentMethod: string = 'upi', failureReason?: string) => {
    return fetchJson<PaymentSimulationResponse>(
      `${API_BASE}/sandbox/payments/simulate`,
      {
        method: 'POST',
        body: JSON.stringify({
          action_id: actionId,
          event_type: eventType,
          payment_method: paymentMethod,
          failure_reason: failureReason
        })
      },
      () => demoStore.simulatePayment(actionId, eventType, paymentMethod, failureReason)
    );
  },
  
  getAuditEvents: (limit: number = 100) => {
    return fetchJson<AuditEvent[]>(
      `${API_BASE}/audit/events?limit=${limit}`,
      undefined,
      () => demoStore.getAuditEvents(limit)
    );
  },
  
  verifyAuditChain: () => {
    return fetchJson<AuditChainVerification>(
      `${API_BASE}/audit/verify`,
      undefined,
      () => demoStore.verifyAuditChain()
    );
  },
  
  resetAndSeedDb: () => {
    return fetchJson<{ status: string; message: string; merchant_id: string }>(
      `${API_BASE}/seed/reset`,
      { method: 'POST' },
      () => {
        demoStore.reset();
        return {
          status: 'success',
          message: 'Demo dataset reset to pristine initial state.',
          merchant_id: 'merch_artisan_001'
        };
      }
    );
  }
};
