import { Router, Request, Response } from 'express';
import authRoutes from './auth.routes';
import preflightRoutes from './preflight.routes';
import buildRoutes from './build.routes';
import projectRoutes from './project.routes';
import organizationRoutes from './organization.routes';
import billingRoutes from './billing.routes';
import dashboardRoutes from './dashboard.routes';

const router = Router();

// Health check endpoint
router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Backend API is running.',
    timestamp: new Date().toISOString(),
  });
});

// Auth endpoints
router.use('/auth', authRoutes);

// Preflight endpoints
router.use('/preflight', preflightRoutes);

// Build & Deploy endpoints
router.use('/build', buildRoutes);

// Projects endpoints
router.use('/projects', projectRoutes);

// Multi-Tenant Organizations endpoints
router.use('/organizations', organizationRoutes);

// Billing & Subscriptions endpoints
router.use('/billing', billingRoutes);

// Dashboard overview endpoints
router.use('/dashboard', dashboardRoutes);

export default router;
