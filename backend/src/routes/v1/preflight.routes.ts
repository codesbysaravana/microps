import { Router } from 'express';
import { analyzeRepository } from '../../controllers/preflight.controller';
import { validateRequest } from '../../middlewares/validate.middleware';
import { analyzeRepoSchema } from '../../validators/preflight.validator';
import { requireAuth } from '../../middlewares/auth.middleware';

const router = Router();

// Protect this route since it hits the GitHub API and uses compute power
router.post('/analyze', requireAuth, validateRequest(analyzeRepoSchema), analyzeRepository);

export default router;
