import { pool } from '../config/db';
import { Organization, OrganizationMember, RoleType } from '../types/tenant.types';

export class OrganizationRepository {
  async findById(id: number): Promise<Organization | null> {
    const res = await pool.query('SELECT * FROM organizations WHERE id = $1', [id]);
    return res.rows[0] || null;
  }

  async findBySlug(slug: string): Promise<Organization | null> {
    const res = await pool.query('SELECT * FROM organizations WHERE slug = $1', [slug]);
    return res.rows[0] || null;
  }

  async findMembershipsByUserId(userId: number): Promise<{ organization: Organization; membership: OrganizationMember }[]> {
    const query = `
      SELECT 
        o.id as org_id, o.name as org_name, o.slug as org_slug, o.billing_email, o.created_at as org_created_at, o.updated_at as org_updated_at,
        m.id as mem_id, m.organization_id, m.user_id, m.role, m.joined_at
      FROM organization_members m
      JOIN organizations o ON m.organization_id = o.id
      WHERE m.user_id = $1
      ORDER BY m.joined_at ASC
    `;
    const res = await pool.query(query, [userId]);
    return res.rows.map(row => ({
      organization: {
        id: row.org_id,
        name: row.org_name,
        slug: row.org_slug,
        billing_email: row.billing_email,
        created_at: row.org_created_at,
        updated_at: row.org_updated_at,
      },
      membership: {
        id: row.mem_id,
        organization_id: row.organization_id,
        user_id: row.user_id,
        role: row.role as RoleType,
        joined_at: row.joined_at,
      }
    }));
  }

  async findMembership(organizationId: number, userId: number): Promise<OrganizationMember | null> {
    const res = await pool.query(
      'SELECT * FROM organization_members WHERE organization_id = $1 AND user_id = $2',
      [organizationId, userId]
    );
    return res.rows[0] || null;
  }

  async createOrganization(name: string, slug: string, billingEmail: string | null, ownerUserId: number): Promise<Organization> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const orgRes = await client.query(
        'INSERT INTO organizations (name, slug, billing_email) VALUES ($1, $2, $3) RETURNING *',
        [name, slug, billingEmail]
      );
      const org = orgRes.rows[0];

      await client.query(
        'INSERT INTO organization_members (organization_id, user_id, role) VALUES ($1, $2, $3)',
        [org.id, ownerUserId, 'OWNER']
      );

      await client.query('COMMIT');
      return org;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

export const organizationRepository = new OrganizationRepository();
