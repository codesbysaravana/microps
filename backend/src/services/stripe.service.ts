import Stripe from 'stripe';
import { stripe } from '../config/stripe';
import { pool } from '../config/db';
import { planRepository } from '../repository/plan.repository';
import { organizationRepository } from '../repository/organization.repository';
import { subscriptionRepository } from '../repository/subscription.repository';

export class StripeService {
  /**
   * Check if a webhook event has already been processed (at-least-once delivery protection).
   */
  async isEventProcessed(eventId: string): Promise<boolean> {
    const res = await pool.query('SELECT 1 FROM stripe_webhook_events WHERE stripe_event_id = $1', [eventId]);
    return (res.rowCount || 0) > 0;
  }

  /**
   * Record a webhook event in the database ledger.
   */
  async recordEvent(eventId: string, eventType: string): Promise<void> {
    await pool.query(
      'INSERT INTO stripe_webhook_events (stripe_event_id, event_type, status) VALUES ($1, $2, $3) ON CONFLICT (stripe_event_id) DO NOTHING',
      [eventId, eventType, 'PROCESSED']
    );
  }

  /**
   * Handle verified Stripe Webhook Events.
   */
  async handleWebhookEvent(event: Stripe.Event): Promise<void> {
    const eventId = event.id;
    if (await this.isEventProcessed(eventId)) {
      console.log(`⚡ [Stripe Webhook] Event ${eventId} (${event.type}) already processed. Skipping.`);
      return;
    }

    console.log(`📦 [Stripe Webhook] Processing event ${eventId} (${event.type})...`);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === 'subscription') {
          await this.handleCheckoutCompleted(session);
        }
        break;
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await this.handleSubscriptionUpdated(subscription);
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await this.handleSubscriptionDeleted(subscription);
        break;
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await this.handleInvoicePaymentSucceeded(invoice);
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await this.handleInvoicePaymentFailed(invoice);
        break;
      }
      default:
        console.log(`ℹ️ [Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    await this.recordEvent(eventId, event.type);
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
    const orgIdStr = session.client_reference_id || session.metadata?.orgId;
    if (!orgIdStr) {
      console.error('❌ [Stripe Webhook] checkout.session.completed missing client_reference_id or orgId metadata');
      return;
    }
    const orgId = parseInt(orgIdStr, 10);
    const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
    const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;

    if (customerId) {
      await pool.query('UPDATE organizations SET stripe_customer_id = $1 WHERE id = $2', [customerId, orgId]);
    }

    if (subscriptionId) {
      const sub = await stripe.subscriptions.retrieve(subscriptionId);
      const priceId = sub.items.data[0]?.price?.id;

      let planId = 2; // Default fallback to PRO plan
      if (priceId) {
        const planRes = await pool.query(
          'SELECT id FROM plans WHERE stripe_price_id_monthly = $1 OR stripe_price_id_yearly = $1 LIMIT 1',
          [priceId]
        );
        if (planRes.rows[0]) {
          planId = planRes.rows[0].id;
        }
      }

      const subAny = sub as any;
      await pool.query(`
        INSERT INTO organization_subscriptions (organization_id, plan_id, status, stripe_subscription_id, stripe_price_id, current_period_start, current_period_end, updated_at)
        VALUES ($1, $2, $3, $4, $5, TO_TIMESTAMP($6), TO_TIMESTAMP($7), NOW())
        ON CONFLICT (organization_id) DO UPDATE
        SET plan_id = EXCLUDED.plan_id, status = EXCLUDED.status, stripe_subscription_id = EXCLUDED.stripe_subscription_id, stripe_price_id = EXCLUDED.stripe_price_id, current_period_start = EXCLUDED.current_period_start, current_period_end = EXCLUDED.current_period_end, updated_at = NOW()
      `, [orgId, planId, sub.status, sub.id, priceId || null, subAny.current_period_start || Math.floor(Date.now()/1000), subAny.current_period_end || Math.floor(Date.now()/1000)+2592000]);

      await subscriptionRepository.logEvent(orgId, null, 'CHECKOUT_COMPLETED', { subscriptionId: sub.id, status: sub.status });
    }
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id;
    if (!customerId) return;

    const orgRes = await pool.query('SELECT id FROM organizations WHERE stripe_customer_id = $1', [customerId]);
    if (!orgRes.rows[0]) return;
    const orgId = orgRes.rows[0].id;

    const priceId = subscription.items.data[0]?.price?.id;
    let planIdUpdateSql = '';
    const subAny = subscription as any;
    const queryParams: any[] = [subscription.status, subAny.current_period_start || Math.floor(Date.now()/1000), subAny.current_period_end || Math.floor(Date.now()/1000)+2592000, subscription.cancel_at_period_end, subscription.id];

    if (priceId) {
      const planRes = await pool.query(
        'SELECT id FROM plans WHERE stripe_price_id_monthly = $1 OR stripe_price_id_yearly = $1 LIMIT 1',
        [priceId]
      );
      if (planRes.rows[0]) {
        queryParams.push(planRes.rows[0].id);
        queryParams.push(priceId);
        planIdUpdateSql = `, plan_id = $6, stripe_price_id = $7`;
      }
    }

    await pool.query(`
      UPDATE organization_subscriptions
      SET status = $1, current_period_start = TO_TIMESTAMP($2), current_period_end = TO_TIMESTAMP($3), cancel_at_period_end = $4${planIdUpdateSql}, updated_at = NOW()
      WHERE stripe_subscription_id = $5 OR organization_id = (SELECT id FROM organizations WHERE stripe_customer_id = '${customerId}')
    `, queryParams);

    await subscriptionRepository.logEvent(orgId, null, 'SUBSCRIPTION_UPDATED', { status: subscription.status, cancelAtPeriodEnd: subscription.cancel_at_period_end });
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id;
    if (!customerId) return;

    const orgRes = await pool.query('SELECT id FROM organizations WHERE stripe_customer_id = $1', [customerId]);
    if (!orgRes.rows[0]) return;
    const orgId = orgRes.rows[0].id;

    const freePlan = await planRepository.findByTier('FREE');
    const freePlanId = freePlan ? freePlan.id : 1;

    await pool.query(`
      UPDATE organization_subscriptions
      SET status = 'canceled', plan_id = $1, cancel_at_period_end = false, updated_at = NOW()
      WHERE stripe_subscription_id = $2 OR organization_id = $3
    `, [freePlanId, subscription.id, orgId]);

    await subscriptionRepository.logEvent(orgId, null, 'SUBSCRIPTION_CANCELED', { subscriptionId: subscription.id });
  }

  private async handleInvoicePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
    if (!customerId) return;

    const orgRes = await pool.query('SELECT id FROM organizations WHERE stripe_customer_id = $1', [customerId]);
    if (!orgRes.rows[0]) return;
    const orgId = orgRes.rows[0].id;

    await pool.query(`
      INSERT INTO invoices (organization_id, invoice_number, amount_due_cents, amount_paid_cents, status, billing_period)
      VALUES ($1, $2, $3, $4, 'PAID', $5)
      ON CONFLICT (invoice_number) DO UPDATE
      SET amount_paid_cents = EXCLUDED.amount_paid_cents, status = 'PAID'
    `, [
      orgId,
      invoice.number || `inv_${Date.now()}`,
      invoice.amount_due,
      invoice.amount_paid,
      new Date(invoice.created * 1000).toISOString().slice(0, 7)
    ]);
  }

  private async handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
    if (!customerId) return;

    const orgRes = await pool.query('SELECT id FROM organizations WHERE stripe_customer_id = $1', [customerId]);
    if (!orgRes.rows[0]) return;
    const orgId = orgRes.rows[0].id;

    await pool.query(`
      UPDATE organization_subscriptions SET status = 'past_due', updated_at = NOW()
      WHERE organization_id = $1
    `, [orgId]);

    await subscriptionRepository.logEvent(orgId, null, 'INVOICE_PAYMENT_FAILED', { invoiceNumber: invoice.number });
  }

  /**
   * Create a Stripe Checkout Session for upgrading or subscribing to a paid tier.
   */
  async createCheckoutSession(organizationId: number, tier: string, successUrl: string, cancelUrl: string): Promise<{ checkoutUrl: string }> {
    const org = await organizationRepository.findById(organizationId);
    if (!org) throw new Error('Organization not found');

    const plan = await planRepository.findByTier(tier.toUpperCase() as any);
    if (!plan) throw new Error(`Plan tier '${tier}' not found`);

    let customerId = (org as any).stripe_customer_id;
    if (!customerId) {
      // Check DB if column exists or fetch via query
      const orgRow = await pool.query('SELECT stripe_customer_id FROM organizations WHERE id = $1', [organizationId]);
      customerId = orgRow.rows[0]?.stripe_customer_id;
    }

    if (!customerId) {
      const customer = await stripe.customers.create({
        name: org.name,
        email: org.billing_email || undefined,
        metadata: { orgId: org.id.toString(), slug: org.slug },
      });
      customerId = customer.id;
      await pool.query('UPDATE organizations SET stripe_customer_id = $1 WHERE id = $2', [customerId, organizationId]);
    }

    // Determine line items: either use stripe_price_id_monthly or dynamic price_data
    let lineItems: Stripe.Checkout.SessionCreateParams.LineItem[];
    if (plan.stripe_price_id_monthly) {
      lineItems = [{ price: plan.stripe_price_id_monthly, quantity: 1 }];
    } else {
      lineItems = [{
        price_data: {
          currency: 'usd',
          product_data: { name: plan.name, description: `MicrOps ${plan.tier} Tier Subscription` },
          unit_amount: plan.price_monthly_cents > 0 ? plan.price_monthly_cents : 2900,
          recurring: { interval: 'month' },
        },
        quantity: 1,
      }];
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: lineItems,
      client_reference_id: org.id.toString(),
      metadata: { orgId: org.id.toString(), targetTier: plan.tier },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    if (!session.url) throw new Error('Stripe failed to generate Checkout URL');
    return { checkoutUrl: session.url };
  }

  /**
   * Create a secure Stripe Customer Portal session for self-serve billing management.
   */
  async createPortalSession(organizationId: number, returnUrl: string): Promise<{ portalUrl: string }> {
    const orgRow = await pool.query('SELECT stripe_customer_id FROM organizations WHERE id = $1', [organizationId]);
    const customerId = orgRow.rows[0]?.stripe_customer_id;

    if (!customerId) {
      throw new Error('No Stripe billing profile exists for this organization yet. Please upgrade to a paid plan first.');
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return { portalUrl: session.url };
  }
}

export const stripeService = new StripeService();
