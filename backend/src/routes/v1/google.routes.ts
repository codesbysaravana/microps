import { Router } from 'express';
import { googleController } from '../../controllers/google.controller';

export const googleRoutes = Router();

// OAuth flow
googleRoutes.get('/auth', googleController.loginRedirect);
googleRoutes.get('/auth/callback', googleController.handleCallback);
