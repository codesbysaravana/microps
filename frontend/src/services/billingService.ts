import { apiClient } from '../lib/api';

export interface Plan {
  id: number;
  name: string;
  tier: 'FREE' | 'PRO' | 'ULTRA' | 'ENTERPRISE';
  price_monthly_cents: number;
  price_yearly_cents: number;
  features: Record<string, any>;
}

export interface UsageMetric {
  metricKey: string;
  used: number;
  limit: number;
  percentage: number;
}

export interface Invoice {
  id: number;
  invoice_number: string;
  amount_due_cents: number;
  amount_paid_cents: number;
  status: string;
  billing_period: string;
  created_at: string;
}

export interface BillingOverview {
  organization: {
    id: number;
    name: string;
    slug: string;
  };
  membership: {
    role: string;
  };
  subscription: {
    status: string;
    cancel_at_period_end: boolean;
  };
  plan: Plan;
  features: Record<string, any>;
  usage: UsageMetric[];
  invoices: Invoice[];
}

export const billingService = {
  getAvailablePlans: () => apiClient<Plan[]>('/billing/plans'),
  getOverview: (orgId?: number) =>
    apiClient<BillingOverview>(`/billing/overview${orgId ? `?orgId=${orgId}` : ''}`),
  upgradePlan: (tier: string) =>
    apiClient<any>('/billing/upgrade', {
      method: 'POST',
      data: { tier },
    }),
  createCheckoutSession: (tier: string) =>
    apiClient<{ checkoutUrl?: string }>('/billing/checkout-session', {
      method: 'POST',
      data: { tier },
    }),
  createPortalSession: () =>
    apiClient<{ portalUrl?: string }>('/billing/portal-session', {
      method: 'POST',
      data: {},
    }),
};
