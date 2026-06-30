import { Request, Response, NextFunction } from 'express';
import { organizationService } from '../services/organization.service';
import { quotaService } from '../services/quota.service';
import { OrganizationContext, RoleType } from '../types/tenant.types';

declare global {
  namespace Express {
    interface Request {
      organizationContext?: OrganizationContext;
    }
  }
}

export const requireOrganization = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized: User authentication required' });
    }

    const orgHeader = req.headers['x-organization-id'] || req.query.orgId;
    const requestedOrgId = orgHeader ? Number(orgHeader) : undefined;

    const context = await organizationService.resolveActiveOrganization(req.user.userId, requestedOrgId);
    if (!context) {
      return res.status(403).json({ success: false, message: 'Forbidden: No active organization found for user' });
    }

    req.organizationContext = context;
    next();
  } catch (err: any) {
    console.error('requireOrganization middleware error:', err);
    res.status(500).json({ success: false, message: 'Internal server error resolving tenant organization context' });
  }
};

export const requireMembership = (allowedRoles?: RoleType[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.organizationContext) {
      return res.status(500).json({ success: false, message: 'Tenant context missing. Ensure requireOrganization precedes requireMembership' });
    }

    const userRole = req.organizationContext.membership.role;
    if (allowedRoles && allowedRoles.length > 0) {
      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: `Forbidden: Membership role '${userRole}' does not have sufficient permissions. Required roles: ${allowedRoles.join(', ')}`,
        });
      }
    }

    next();
  };
};

export const requireQuota = (metricKey: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.organizationContext) {
        return res.status(500).json({ success: false, message: 'Tenant context missing for quota verification' });
      }

      const orgId = req.organizationContext.organization.id;
      const status = await quotaService.checkQuota(orgId, metricKey);

      if (!status.allowed) {
        return res.status(429).json({
          success: false,
          message: `Quota Exceeded: Organization has reached its limit for '${metricKey}' (${status.used} / ${status.limit}). Please upgrade your plan.`,
          data: status,
        });
      }

      next();
    } catch (err) {
      console.error('requireQuota middleware error:', err);
      res.status(500).json({ success: false, message: 'Internal server error verifying organization quota' });
    }
  };
};
