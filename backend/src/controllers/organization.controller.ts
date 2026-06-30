import { Request, Response } from 'express';
import { organizationService } from '../services/organization.service';

export const getMyOrganizations = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const contexts = await organizationService.getUserOrganizationsContext(req.user.userId);
    const activeContext = req.organizationContext || (contexts.length > 0 ? contexts[0] : null);

    return res.status(200).json({
      success: true,
      data: {
        activeContext,
        organizations: contexts,
      },
    });
  } catch (err: any) {
    console.error('getMyOrganizations error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Error fetching organizations' });
  }
};
