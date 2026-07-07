import { Router } from 'express';
import { githubController } from '../../controllers/github.controller';
import { requireAuth } from '../../middlewares/auth.middleware';

const router = Router();

// OAuth Routes
router.get('/auth', githubController.loginRedirect);
router.get('/auth/callback', githubController.handleCallback);

// Repo & BYOC Setup Routes
router.get('/repos', requireAuth, githubController.getUserRepos);
router.post('/repos/install-runner', requireAuth, githubController.installRunner);

export const githubRoutes = router;
