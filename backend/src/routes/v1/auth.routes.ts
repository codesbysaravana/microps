import { Router } from 'express';
import { authController } from '../../controllers/auth.controller';
import { validateRequest } from '../../middlewares/validate.middleware';
import { requireAuth } from '../../middlewares/auth.middleware';
import { signupSchema, loginSchema } from '../../validators/auth.validator';

const router = Router();

// Public routes
router.post('/signup', validateRequest(signupSchema), authController.signup);
router.post('/login', validateRequest(loginSchema), authController.login);

// Protected routes
router.get('/me', requireAuth, authController.me);
router.put('/profile', requireAuth, authController.updateProfile);

export default router;
