import { pool } from '../config/db';
import { Plan, PlanFeature, PlanTier } from '../types/billing.types';

export class PlanRepository {
  async findAllActivePlans(): Promise<Plan[]> {
    const res = await pool.query('SELECT * FROM plans WHERE is_active = true ORDER BY price_monthly_cents ASC');
    return res.rows;
  }

  async findByTier(tier: PlanTier): Promise<Plan | null> {
    const res = await pool.query('SELECT * FROM plans WHERE tier = $1', [tier]);
    return res.rows[0] || null;
  }

  async findById(id: number): Promise<Plan | null> {
    const res = await pool.query('SELECT * FROM plans WHERE id = $1', [id]);
    return res.rows[0] || null;
  }

  async findFeaturesByPlanId(planId: number): Promise<PlanFeature[]> {
    const res = await pool.query('SELECT * FROM plan_features WHERE plan_id = $1', [planId]);
    return res.rows;
  }
}

export const planRepository = new PlanRepository();
