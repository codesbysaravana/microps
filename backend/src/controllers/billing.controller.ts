import { Request, Response } from 'express';
import { planService } from '../services/plan.service';
import { billingService } from '../services/billing.service';
import { subscriptionRepository } from '../repository/subscription.repository';
import { planRepository } from '../repository/plan.repository';
import { PlanTier } from '../types/billing.types';
import { stripeService } from '../services/stripe.service';

export const getAvailablePlans = async (req: Request, res: Response) => {
  try {
    const plans = await planService.getAllPlansWithFeatures();
    return res.status(200).json({ success: true, data: plans });
  } catch (err: any) {
    console.error('getAvailablePlans error:', err);
    return res.status(500).json({ success: false, message: 'Error fetching database-driven plans' });
  }
};

export const getBillingOverview = async (req: Request, res: Response) => {
  try {
    if (!req.organizationContext) {
      return res.status(400).json({ success: false, message: 'Missing organization context' });
    }

    const orgId = req.organizationContext.organization.id;
    const overview = await billingService.getOrganizationBillingOverview(orgId);

    return res.status(200).json({
      success: true,
      data: {
        organization: req.organizationContext.organization,
        membership: req.organizationContext.membership,
        ...overview,
      },
    });
  } catch (err: any) {
    console.error('getBillingOverview error:', err);
    return res.status(500).json({ success: false, message: 'Error fetching billing overview' });
  }
};

export const upgradeSubscriptionPlaceholder = async (req: Request, res: Response) => {
  try {
    if (!req.organizationContext) {
      return res.status(400).json({ success: false, message: 'Missing organization context' });
    }

    const { tier } = req.body;
    if (!tier) {
      return res.status(400).json({ success: false, message: 'Target plan tier required' });
    }

    const targetPlan = await planRepository.findByTier(tier.toUpperCase() as PlanTier);
    if (!targetPlan) {
      return res.status(404).json({ success: false, message: `Plan tier '${tier}' not found` });
    }

    const orgId = req.organizationContext.organization.id;
    const sub = await subscriptionRepository.upsertSubscription(orgId, targetPlan.id, 'ACTIVE');
    await subscriptionRepository.logEvent(orgId, sub.id, 'PLAN_CHANGED', { targetTier: targetPlan.tier, planId: targetPlan.id });

    const overview = await billingService.getOrganizationBillingOverview(orgId);

    return res.status(200).json({
      success: true,
      message: `Organization subscription successfully transitioned to ${targetPlan.name} (${targetPlan.tier})`,
      data: overview,
    });
  } catch (err: any) {
    console.error('upgradeSubscriptionPlaceholder error:', err);
    return res.status(500).json({ success: false, message: 'Error upgrading subscription' });
  }
};

export const createCheckoutSession = async (req: Request, res: Response) => {
  try {
    if (!req.organizationContext) {
      return res.status(400).json({ success: false, message: 'Missing organization context' });
    }
    const { tier, successUrl, cancelUrl } = req.body;
    if (!tier) {
      return res.status(400).json({ success: false, message: 'Plan tier required' });
    }

    const orgId = req.organizationContext.organization.id;
    const origin = req.headers.origin || 'http://localhost:5173';
    const sUrl = successUrl || `${origin}/dashboard?checkout=success`;
    const cUrl = cancelUrl || `${origin}/dashboard?checkout=canceled`;

    if (!process.env.STRIPE_SECRET_KEY) {
      // Dev/Testing fallback: execute placeholder upgrade if Stripe keys aren't set
      console.warn('⚠️ [Stripe Checkout] STRIPE_SECRET_KEY missing. Falling back to dev subscription transition.');
      return upgradeSubscriptionPlaceholder(req, res);
    }

    const session = await stripeService.createCheckoutSession(orgId, tier, sUrl, cUrl);
    return res.status(200).json({ success: true, data: session });
  } catch (err: any) {
    console.error('createCheckoutSession error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed to initialize Stripe Checkout' });
  }
};

export const createPortalSession = async (req: Request, res: Response) => {
  try {
    if (!req.organizationContext) {
      return res.status(400).json({ success: false, message: 'Missing organization context' });
    }
    const orgId = req.organizationContext.organization.id;
    const origin = req.headers.origin || 'http://localhost:5173';
    const { returnUrl } = req.body;
    const rUrl = returnUrl || `${origin}/dashboard`;

    const session = await stripeService.createPortalSession(orgId, rUrl);
    return res.status(200).json({ success: true, data: session });
  } catch (err: any) {
    console.error('createPortalSession error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed to initialize Stripe Customer Portal' });
  }
};