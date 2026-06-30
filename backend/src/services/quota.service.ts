import { usageRepository } from '../repository/usage.repository';
import { subscriptionRepository } from '../repository/subscription.repository';
import { planService } from './plan.service';

export class QuotaService {
  async checkQuota(organizationId: number, metricKey: string): Promise<{ allowed: boolean; used: number; limit: number }> {
    let usage = await usageRepository.findMetricUsage(organizationId, metricKey);
    
    if (!usage) {
      // Initialize usage from subscription plan features
      const sub = await subscriptionRepository.findByOrganizationId(organizationId);
      let limit = 100; // default safe fallback
      if (sub) {
        const features = await planService.getPlanFeatures(sub.plan_id);
        if (typeof features[metricKey] === 'number') {
          limit = features[metricKey];
        }
      }
      usage = await usageRepository.setMetricUsage(organizationId, metricKey, 0, limit);
    }

    const allowed = Number(usage.used_value) < Number(usage.limit_value);
    return {
      allowed,
      used: Number(usage.used_value),
      limit: Number(usage.limit_value),
    };
  }

  async recordUsage(organizationId: number, metricKey: string, incrementBy: number = 1): Promise<void> {
    await usageRepository.incrementUsage(organizationId, metricKey, incrementBy);
  }
}

export const quotaService = new QuotaService();
