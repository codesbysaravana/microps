import { subscriptionRepository } from '../repository/subscription.repository';
import { planRepository } from '../repository/plan.repository';
import { usageRepository } from '../repository/usage.repository';
import { invoiceRepository } from '../repository/invoice.repository';
import { planService } from './plan.service';

export class BillingService {
  async getOrganizationBillingOverview(organizationId: number) {
    const subscription = await subscriptionRepository.findByOrganizationId(organizationId);
    let plan = null;
    let features = {};

    if (subscription) {
      plan = await planRepository.findById(subscription.plan_id);
      features = await planService.getPlanFeatures(subscription.plan_id);
    } else {
      // Fallback to free plan if no subscription record exists yet
      plan = await planRepository.findByTier('FREE');
      if (plan) {
        features = await planService.getPlanFeatures(plan.id);
      }
    }

    const usageRows = await usageRepository.findUsageByOrganizationId(organizationId);
    const invoices = await invoiceRepository.findByOrganizationId(organizationId);

    return {
      subscription: subscription || { status: 'ACTIVE', cancel_at_period_end: false },
      plan: plan || { name: 'Hobby Explorer', tier: 'FREE', price_monthly_cents: 0 },
      features,
      usage: usageRows.map(u => ({
        metricKey: u.metric_key,
        used: Number(u.used_value),
        limit: Number(u.limit_value),
        percentage: Number(u.limit_value) > 0 ? Math.min(100, Math.round((Number(u.used_value) / Number(u.limit_value)) * 100)) : 0,
      })),
      invoices,
    };
  }
}

export const billingService = new BillingService();
