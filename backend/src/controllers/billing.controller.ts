import { Request, Response } from 'express';
import { planService } from '../services/plan.service';
import { billingService } from '../services/billing.service';
import { subscriptionRepository } from '../repository/subscription.repository';
import { planRepository } from '../repository/plan.repository';
import { PlanTier } from '../types/billing.types';

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
