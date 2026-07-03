import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware';
import { requireOrganization, requireMembership } from '../../middlewares/tenant.middleware';
import { getAvailablePlans, getBillingOverview, upgradeSubscriptionPlaceholder, createCheckoutSession, createPortalSession } from '../../controllers/billing.controller';

const router = Router();

router.get('/plans', getAvailablePlans);

router.use(requireAuth, requireOrganization);
router.get('/overview', getBillingOverview);
router.post('/upgrade', requireMembership(['OWNER', 'ADMIN', 'BILLING_MANAGER']), createCheckoutSession);
router.post('/checkout-session', requireMembership(['OWNER', 'ADMIN', 'BILLING_MANAGER']), createCheckoutSession);
router.post('/portal-session', requireMembership(['OWNER', 'ADMIN', 'BILLING_MANAGER']), createPortalSession);

export default router;
