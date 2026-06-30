import { pool } from '../config/db';
import { OrganizationUsage } from '../types/billing.types';

export class UsageRepository {
  async findUsageByOrganizationId(organizationId: number): Promise<OrganizationUsage[]> {
    const res = await pool.query(
      'SELECT * FROM organization_usage WHERE organization_id = $1 ORDER BY metric_key ASC',
      [organizationId]
    );
    return res.rows;
  }

  async findMetricUsage(organizationId: number, metricKey: string): Promise<OrganizationUsage | null> {
    const res = await pool.query(
      'SELECT * FROM organization_usage WHERE organization_id = $1 AND metric_key = $2',
      [organizationId, metricKey]
    );
    return res.rows[0] || null;
  }

  async setMetricUsage(organizationId: number, metricKey: string, usedValue: number, limitValue: number): Promise<OrganizationUsage> {
    const res = await pool.query(`
      INSERT INTO organization_usage (organization_id, metric_key, used_value, limit_value, updated_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (organization_id, metric_key) DO UPDATE
      SET used_value = EXCLUDED.used_value, limit_value = EXCLUDED.limit_value, updated_at = NOW()
      RETURNING *
    `, [organizationId, metricKey, usedValue, limitValue]);
    return res.rows[0];
  }

  async incrementUsage(organizationId: number, metricKey: string, incrementBy: number = 1): Promise<OrganizationUsage | null> {
    const res = await pool.query(`
      UPDATE organization_usage
      SET used_value = used_value + $1, updated_at = NOW()
      WHERE organization_id = $2 AND metric_key = $3
      RETURNING *
    `, [incrementBy, organizationId, metricKey]);
    return res.rows[0] || null;
  }
}

export const usageRepository = new UsageRepository();
