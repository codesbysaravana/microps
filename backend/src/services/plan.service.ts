import { planRepository } from '../repository/plan.repository';
import { Plan, PlanFeature, PlanTier } from '../types/billing.types';

export interface PlanWithFeatures extends Plan {
  features: Record<string, any>;
}

export class PlanService {
  async getAllPlansWithFeatures(): Promise<PlanWithFeatures[]> {
    const plans = await planRepository.findAllActivePlans();
    const result: PlanWithFeatures[] = [];

    for (const plan of plans) {
      const featureRows = await planRepository.findFeaturesByPlanId(plan.id);
      const featuresMap: Record<string, any> = {};

      for (const f of featureRows) {
        if (f.value_type === 'NUMBER') {
          featuresMap[f.feature_key] = Number(f.feature_value);
        } else if (f.value_type === 'BOOLEAN') {
          featuresMap[f.feature_key] = f.feature_value === 'true';
        } else {
          featuresMap[f.feature_key] = f.feature_value;
        }
      }

      result.push({
        ...plan,
        features: featuresMap,
      });
    }

    return result;
  }

  async getPlanFeatures(planId: number): Promise<Record<string, any>> {
    const featureRows = await planRepository.findFeaturesByPlanId(planId);
    const featuresMap: Record<string, any> = {};

    for (const f of featureRows) {
      if (f.value_type === 'NUMBER') {
        featuresMap[f.feature_key] = Number(f.feature_value);
      } else if (f.value_type === 'BOOLEAN') {
        featuresMap[f.feature_key] = f.feature_value === 'true';
      } else {
        featuresMap[f.feature_key] = f.feature_value;
      }
    }

    return featuresMap;
  }
}

export const planService = new PlanService();
