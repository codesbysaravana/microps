import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware';
import { requireOrganization, requireMembership } from '../../middlewares/tenant.middleware';
import { getAvailablePlans, getBillingOverview, upgradeSubscriptionPlaceholder } from '../../controllers/billing.controller';

const router = Router();

router.get('/plans', getAvailablePlans);

router.use(requireAuth, requireOrganization);
router.get('/overview', getBillingOverview);
router.post('/upgrade', requireMembership(['OWNER', 'ADMIN', 'BILLING_MANAGER']), upgradeSubscriptionPlaceholder);

export default router;
