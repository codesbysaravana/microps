export type PlanTier = 'FREE' | 'PRO' | 'ULTRA' | 'ENTERPRISE';

export interface Plan {
  id: number;
  name: string;
  tier: PlanTier;
  price_monthly_cents: number;
  price_yearly_cents: number;
  is_active: boolean;
  created_at: Date;
}

export interface PlanFeature {
  id: number;
  plan_id: number;
  feature_key: string;
  feature_value: string;
  value_type: 'STRING' | 'NUMBER' | 'BOOLEAN';
}

export interface OrganizationSubscription {
  id: number;
  organization_id: number;
  plan_id: number;
  status: string;
  current_period_start: Date;
  current_period_end: Date | null;
  cancel_at_period_end: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface OrganizationUsage {
  id: number;
  organization_id: number;
  metric_key: string;
  used_value: number;
  limit_value: number;
  period_start: Date;
  period_end: Date | null;
  updated_at: Date;
}

export interface Invoice {
  id: number;
  organization_id: number;
  subscription_id: number | null;
  invoice_number: string;
  amount_due_cents: number;
  amount_paid_cents: number;
  status: string;
  billing_period: string;
  created_at: Date;
}
