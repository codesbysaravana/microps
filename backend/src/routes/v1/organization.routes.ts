import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware';
import { requireOrganization } from '../../middlewares/tenant.middleware';
import { getMyOrganizations } from '../../controllers/organization.controller';

const router = Router();

router.use(requireAuth);
router.get('/me', requireOrganization, getMyOrganizations);

export default router;
