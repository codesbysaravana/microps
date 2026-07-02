import { Router } from 'express';
import { getDashboardOverview } from '../../controllers/dashboard.controller';
import { requireAuth } from '../../middlewares/auth.middleware';

const router = Router();

router.get('/overview', requireAuth, getDashboardOverview);

export default router;
