import { Router } from 'express';
import { handleStripeWebhook } from '../../controllers/webhook.controller';
import { handleGithubWebhook } from '../../controllers/github.webhook.controller';

const router = Router();

router.post('/stripe', handleStripeWebhook);
router.post('/github/completion', handleGithubWebhook);

export default router;
