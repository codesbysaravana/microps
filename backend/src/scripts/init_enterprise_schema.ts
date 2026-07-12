import { pool } from '../config/db';

export const runEnterpriseMigrationAndSeed = async () => {
  const client = await pool.connect();
  try {
    console.log('🚀 [Enterprise Architecture] Starting Multi-Tenant & Billing Schema Setup...');
    await client.query('BEGIN');

    // 1. Core Users & Projects check
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT,
        github_id VARCHAR(255) UNIQUE,
        github_username VARCHAR(255),
        github_access_token TEXT,
        google_id VARCHAR(255) UNIQUE,
        google_access_token TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Ensure password_hash is nullable for existing DBs
    await client.query(`ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;`);
    
    // Ensure google fields exist for existing DBs
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE;`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS google_access_token TEXT;`);

    // 2. Multi-Tenant Organizations
    console.log('📦 Creating organizations table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS organizations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        billing_email VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Organization Memberships (RBAC)
    console.log('👥 Creating organization_members table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS organization_members (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(50) NOT NULL DEFAULT 'DEVELOPER',
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_org_user UNIQUE (organization_id, user_id)
      );
    `);

    // 4. Organization Invitations
    console.log('✉️ Creating organization_invitations table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS organization_invitations (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        email VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'DEVELOPER',
        token VARCHAR(128) UNIQUE NOT NULL,
        status VARCHAR(50) DEFAULT 'PENDING',
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 5. Database-Driven Plans
    console.log('💳 Creating plans table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS plans (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        tier VARCHAR(50) UNIQUE NOT NULL,
        price_monthly_cents INTEGER DEFAULT 0,
        price_yearly_cents INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 6. Plan Features & Limits
    console.log('⚙️ Creating plan_features table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS plan_features (
        id SERIAL PRIMARY KEY,
        plan_id INTEGER NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
        feature_key VARCHAR(100) NOT NULL,
        feature_value TEXT NOT NULL,
        value_type VARCHAR(50) DEFAULT 'STRING',
        CONSTRAINT unique_plan_feature UNIQUE (plan_id, feature_key)
      );
    `);

    // 7. Organization Subscriptions
    console.log('📑 Creating organization_subscriptions table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS organization_subscriptions (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER UNIQUE NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        plan_id INTEGER NOT NULL REFERENCES plans(id),
        status VARCHAR(50) DEFAULT 'ACTIVE',
        current_period_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        current_period_end TIMESTAMP,
        cancel_at_period_end BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 8. Subscription Lifecycle Audit & Webhook Events
    console.log('📜 Creating subscription_events table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS subscription_events (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        subscription_id INTEGER REFERENCES organization_subscriptions(id) ON DELETE CASCADE,
        event_type VARCHAR(100) NOT NULL,
        payload TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 9. Real-time Quota & Usage Tracking
    console.log('📊 Creating organization_usage table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS organization_usage (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        metric_key VARCHAR(100) NOT NULL,
        used_value NUMERIC(15, 2) DEFAULT 0,
        limit_value NUMERIC(15, 2) DEFAULT 0,
        period_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        period_end TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_org_metric UNIQUE (organization_id, metric_key)
      );
    `);

    // 10. Invoices Ledger
    console.log('🧾 Creating invoices table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        subscription_id INTEGER REFERENCES organization_subscriptions(id) ON DELETE SET NULL,
        invoice_number VARCHAR(100) UNIQUE NOT NULL,
        amount_due_cents INTEGER NOT NULL,
        amount_paid_cents INTEGER DEFAULT 0,
        status VARCHAR(50) DEFAULT 'PAID',
        billing_period VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 11. Alter projects table to attach organization_id & github integration fields
    console.log('🔗 Attaching organization_id and github fields to projects...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        repo_url TEXT NOT NULL,
        github_repo_owner VARCHAR(255),
        github_repo_name VARCHAR(255),
        github_webhook_id VARCHAR(255),
        github_workflow_installed BOOLEAN DEFAULT false,
        branch VARCHAR(255) DEFAULT 'main',
        language VARCHAR(100),
        framework VARCHAR(100),
        install_command TEXT,
        build_command TEXT,
        live_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='projects' AND column_name='organization_id'
        ) THEN
          ALTER TABLE projects ADD COLUMN organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE;
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='projects' AND column_name='live_url'
        ) THEN
          ALTER TABLE projects ADD COLUMN live_url VARCHAR(255);
        END IF;
        
        -- GitHub Integration Columns for existing DBs
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='github_repo_owner') THEN
          ALTER TABLE projects ADD COLUMN github_repo_owner VARCHAR(255);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='github_repo_name') THEN
          ALTER TABLE projects ADD COLUMN github_repo_name VARCHAR(255);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='github_webhook_id') THEN
          ALTER TABLE projects ADD COLUMN github_webhook_id VARCHAR(255);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='github_workflow_installed') THEN
          ALTER TABLE projects ADD COLUMN github_workflow_installed BOOLEAN DEFAULT false;
        END IF;
        
        -- ECS Service Tracking Columns (multi-tenant isolation)
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='ecs_service_name') THEN
          ALTER TABLE projects ADD COLUMN ecs_service_name TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='ecs_task_family') THEN
          ALTER TABLE projects ADD COLUMN ecs_task_family TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='last_deployed_at') THEN
          ALTER TABLE projects ADD COLUMN last_deployed_at TIMESTAMP;
        END IF;
        
        -- Users GitHub Columns
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='github_id') THEN
          ALTER TABLE users ADD COLUMN github_id VARCHAR(255) UNIQUE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='github_username') THEN
          ALTER TABLE users ADD COLUMN github_username VARCHAR(255);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='github_access_token') THEN
          ALTER TABLE users ADD COLUMN github_access_token TEXT;
        END IF;
      END $$;
    `);

    // 11.5 Stripe Billing & Webhook Idempotency Schema
    console.log('💳 Adding Stripe integration schema columns and idempotency ledger...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS stripe_webhook_events (
        id SERIAL PRIMARY KEY,
        stripe_event_id VARCHAR(255) UNIQUE NOT NULL,
        event_type VARCHAR(100) NOT NULL,
        status VARCHAR(50) DEFAULT 'PROCESSED',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='organizations' AND column_name='stripe_customer_id') THEN
          ALTER TABLE organizations ADD COLUMN stripe_customer_id VARCHAR(255) UNIQUE;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='plans' AND column_name='stripe_product_id') THEN
          ALTER TABLE plans ADD COLUMN stripe_product_id VARCHAR(255);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='plans' AND column_name='stripe_price_id_monthly') THEN
          ALTER TABLE plans ADD COLUMN stripe_price_id_monthly VARCHAR(255);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='plans' AND column_name='stripe_price_id_yearly') THEN
          ALTER TABLE plans ADD COLUMN stripe_price_id_yearly VARCHAR(255);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='organization_subscriptions' AND column_name='stripe_subscription_id') THEN
          ALTER TABLE organization_subscriptions ADD COLUMN stripe_subscription_id VARCHAR(255) UNIQUE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='organization_subscriptions' AND column_name='stripe_price_id') THEN
          ALTER TABLE organization_subscriptions ADD COLUMN stripe_price_id VARCHAR(255);
        END IF;
      END $$;
    `);

    // 12. Create Indexes
    console.log('⚡ Creating performance indexes...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON organization_members(organization_id);
      CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON organization_members(user_id);
      CREATE INDEX IF NOT EXISTS idx_org_invites_org_id ON organization_invitations(organization_id);
      CREATE INDEX IF NOT EXISTS idx_org_subs_org_id ON organization_subscriptions(organization_id);
      CREATE INDEX IF NOT EXISTS idx_org_usage_org_id ON organization_usage(organization_id);
      CREATE INDEX IF NOT EXISTS idx_plan_features_plan_id ON plan_features(plan_id);
      CREATE INDEX IF NOT EXISTS idx_invoices_org_id ON invoices(organization_id);
      CREATE INDEX IF NOT EXISTS idx_projects_org_id ON projects(organization_id);
      CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_event_id ON stripe_webhook_events(stripe_event_id);
    `);

    // 13. Seed Plans
    console.log('💎 Seeding database-driven Plans & Features...');
    const plansData = [
      { name: 'Hobby Explorer', tier: 'FREE', monthly: 0, yearly: 0 },
      { name: 'Pro Developer', tier: 'PRO', monthly: 2900, yearly: 29000 },
      { name: 'Ultra Team', tier: 'ULTRA', monthly: 9900, yearly: 99000 },
      { name: 'Enterprise Platform', tier: 'ENTERPRISE', monthly: 49900, yearly: 499000 },
    ];

    const planIds: Record<string, number> = {};

    for (const p of plansData) {
      const res = await client.query(`
        INSERT INTO plans (name, tier, price_monthly_cents, price_yearly_cents)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (tier) DO UPDATE
        SET name = EXCLUDED.name, price_monthly_cents = EXCLUDED.price_monthly_cents, price_yearly_cents = EXCLUDED.price_yearly_cents
        RETURNING id, tier;
      `, [p.name, p.tier, p.monthly, p.yearly]);
      planIds[p.tier] = res.rows[0].id;
    }

    // Seed features for plans
    const featuresSeed = [
      // FREE
      { tier: 'FREE', key: 'max_projects', value: '3', type: 'NUMBER' },
      { tier: 'FREE', key: 'max_deployments', value: '10', type: 'NUMBER' },
      { tier: 'FREE', key: 'build_minutes', value: '100', type: 'NUMBER' },
      { tier: 'FREE', key: 'egress_gb', value: '50', type: 'NUMBER' },
      { tier: 'FREE', key: 'custom_domains', value: 'false', type: 'BOOLEAN' },
      { tier: 'FREE', key: 'support_level', value: 'Community', type: 'STRING' },

      // PRO
      { tier: 'PRO', key: 'max_projects', value: '25', type: 'NUMBER' },
      { tier: 'PRO', key: 'max_deployments', value: '200', type: 'NUMBER' },
      { tier: 'PRO', key: 'build_minutes', value: '1000', type: 'NUMBER' },
      { tier: 'PRO', key: 'egress_gb', value: '500', type: 'NUMBER' },
      { tier: 'PRO', key: 'custom_domains', value: 'true', type: 'BOOLEAN' },
      { tier: 'PRO', key: 'support_level', value: 'Standard 24x7', type: 'STRING' },

      // ULTRA
      { tier: 'ULTRA', key: 'max_projects', value: '100', type: 'NUMBER' },
      { tier: 'ULTRA', key: 'max_deployments', value: '1000', type: 'NUMBER' },
      { tier: 'ULTRA', key: 'build_minutes', value: '5000', type: 'NUMBER' },
      { tier: 'ULTRA', key: 'egress_gb', value: '2500', type: 'NUMBER' },
      { tier: 'ULTRA', key: 'custom_domains', value: 'true', type: 'BOOLEAN' },
      { tier: 'ULTRA', key: 'support_level', value: 'Priority Dedicated SLAs', type: 'STRING' },

      // ENTERPRISE
      { tier: 'ENTERPRISE', key: 'max_projects', value: '9999', type: 'NUMBER' },
      { tier: 'ENTERPRISE', key: 'max_deployments', value: '99999', type: 'NUMBER' },
      { tier: 'ENTERPRISE', key: 'build_minutes', value: '50000', type: 'NUMBER' },
      { tier: 'ENTERPRISE', key: 'egress_gb', value: '25000', type: 'NUMBER' },
      { tier: 'ENTERPRISE', key: 'custom_domains', value: 'true', type: 'BOOLEAN' },
      { tier: 'ENTERPRISE', key: 'support_level', value: 'Dedicated Solutions Architect', type: 'STRING' },
    ];

    for (const f of featuresSeed) {
      const pid = planIds[f.tier];
      if (pid) {
        await client.query(`
          INSERT INTO plan_features (plan_id, feature_key, feature_value, value_type)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (plan_id, feature_key) DO UPDATE
          SET feature_value = EXCLUDED.feature_value, value_type = EXCLUDED.value_type;
        `, [pid, f.key, f.value, f.type]);
      }
    }

    // 14. Ensure backward compatibility: For all existing users, create a default organization if they don't have one
    const usersRes = await client.query(`SELECT id, name, email FROM users;`);
    for (const u of usersRes.rows) {
      const orgSlug = `org-${u.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${u.id}`;
      // Check if user has membership
      const memCheck = await client.query(`SELECT id FROM organization_members WHERE user_id = $1;`, [u.id]);
      let orgId: number;
      if (memCheck.rows.length === 0) {
        const orgRes = await client.query(`
          INSERT INTO organizations (name, slug, billing_email)
          VALUES ($1, $2, $3)
          ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
          RETURNING id;
        `, [`${u.name}'s Organization`, orgSlug, u.email]);
        orgId = orgRes.rows[0].id;

        await client.query(`
          INSERT INTO organization_members (organization_id, user_id, role)
          VALUES ($1, $2, 'OWNER')
          ON CONFLICT (organization_id, user_id) DO NOTHING;
        `, [orgId, u.id]);

        // Create subscription
        await client.query(`
          INSERT INTO organization_subscriptions (organization_id, plan_id, status)
          VALUES ($1, $2, 'ACTIVE')
          ON CONFLICT (organization_id) DO NOTHING;
        `, [orgId, planIds['PRO'] || planIds['FREE']]);

        // Seed usage bars for this org
        await client.query(`
          INSERT INTO organization_usage (organization_id, metric_key, used_value, limit_value)
          VALUES 
            ($1, 'build_minutes', 42, 1000),
            ($1, 'egress_gb', 18.4, 500)
          ON CONFLICT (organization_id, metric_key) DO UPDATE
          SET used_value = EXCLUDED.used_value, limit_value = EXCLUDED.limit_value;
        `, [orgId]);

        // Seed sample invoices
        await client.query(`
          INSERT INTO invoices (organization_id, invoice_number, amount_due_cents, amount_paid_cents, status, billing_period)
          VALUES
            ($1, $2, 2900, 2900, 'PAID', 'June 2026'),
            ($1, $3, 2900, 2900, 'PAID', 'May 2026')
          ON CONFLICT (invoice_number) DO NOTHING;
        `, [orgId, `INV-${orgId}-202606`, `INV-${orgId}-202605`]);
      } else {
        // Find their org id
        const memOrg = await client.query(`SELECT organization_id FROM organization_members WHERE user_id = $1 LIMIT 1;`, [u.id]);
        orgId = memOrg.rows[0].organization_id;
      }

      // Associate existing projects lacking an orgId to this user's primary org
      await client.query(`
        UPDATE projects SET organization_id = $1 WHERE user_id = $2 AND organization_id IS NULL;
      `, [orgId, u.id]);
    }

    // 15. Seed 3 Showcase Test Organizations (Free, Pro, Ultra)
    const showcaseOrgs = [
      { name: 'MicrOps Hobbyists', slug: 'microps-hobbyists', email: 'hobby@microps.in', tier: 'FREE', usedMins: 82, limitMins: 100, usedGb: 38.5, limitGb: 50 },
      { name: 'Acme Cloud Inc', slug: 'acme-cloud', email: 'billing@acmecloud.io', tier: 'PRO', usedMins: 340, limitMins: 1000, usedGb: 142.8, limitGb: 500 },
      { name: 'HyperScale Systems', slug: 'hyperscale-systems', email: 'ops@hyperscale.org', tier: 'ULTRA', usedMins: 3120, limitMins: 5000, usedGb: 1890.2, limitGb: 2500 },
    ];

    // Ensure there is at least one test user to own showcase orgs
    let showcaseUserRes = await client.query(`SELECT id FROM users LIMIT 1;`);
    let showcaseUserId: number;
    if (showcaseUserRes.rows.length === 0) {
      const newUser = await client.query(`
        INSERT INTO users (name, email, password_hash)
        VALUES ('Operator Admin', 'admin@microps.in', '$2b$10$YourHashedPasswordHere')
        RETURNING id;
      `);
      showcaseUserId = newUser.rows[0].id;
    } else {
      showcaseUserId = showcaseUserRes.rows[0].id;
    }

    for (const s of showcaseOrgs) {
      const orgRes = await client.query(`
        INSERT INTO organizations (name, slug, billing_email)
        VALUES ($1, $2, $3)
        ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
        RETURNING id;
      `, [s.name, s.slug, s.email]);
      const oid = orgRes.rows[0].id;

      await client.query(`
        INSERT INTO organization_members (organization_id, user_id, role)
        VALUES ($1, $2, 'OWNER')
        ON CONFLICT (organization_id, user_id) DO NOTHING;
      `, [oid, showcaseUserId]);

      await client.query(`
        INSERT INTO organization_subscriptions (organization_id, plan_id, status)
        VALUES ($1, $2, 'ACTIVE')
        ON CONFLICT (organization_id) DO UPDATE SET plan_id = EXCLUDED.plan_id;
      `, [oid, planIds[s.tier]]);

      await client.query(`
        INSERT INTO organization_usage (organization_id, metric_key, used_value, limit_value)
        VALUES 
          ($1, 'build_minutes', $2, $3),
          ($1, 'egress_gb', $4, $5)
        ON CONFLICT (organization_id, metric_key) DO UPDATE
        SET used_value = EXCLUDED.used_value, limit_value = EXCLUDED.limit_value;
      `, [oid, s.usedMins, s.limitMins, s.usedGb, s.limitGb]);
    }

    await client.query('COMMIT');
    console.log('✅ Enterprise Multi-Tenant & Billing Foundation successfully initialized!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration Error:', err);
    throw err;
  } finally {
    client.release();
  }
};

if (require.main === module) {
  runEnterpriseMigrationAndSeed()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
