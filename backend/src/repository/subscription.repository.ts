import { pool } from '../config/db';
import { OrganizationSubscription } from '../types/billing.types';

export class SubscriptionRepository {
  async findByOrganizationId(organizationId: number): Promise<OrganizationSubscription | null> {
    const res = await pool.query(
      'SELECT * FROM organization_subscriptions WHERE organization_id = $1',
      [organizationId]
    );
    return res.rows[0] || null;
  }

  async upsertSubscription(organizationId: number, planId: number, status: string = 'ACTIVE'): Promise<OrganizationSubscription> {
    const res = await pool.query(`
      INSERT INTO organization_subscriptions (organization_id, plan_id, status, updated_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (organization_id) DO UPDATE
      SET plan_id = EXCLUDED.plan_id, status = EXCLUDED.status, updated_at = NOW()
      RETURNING *
    `, [organizationId, planId, status]);
    return res.rows[0];
  }

  async logEvent(organizationId: number, subscriptionId: number | null, eventType: string, payload: any): Promise<void> {
    await pool.query(
      'INSERT INTO subscription_events (organization_id, subscription_id, event_type, payload) VALUES ($1, $2, $3, $4)',
      [organizationId, subscriptionId, eventType, JSON.stringify(payload)]
    );
  }
}

export const subscriptionRepository = new SubscriptionRepository();
