import { organizationRepository } from '../repository/organization.repository';
import { userRepository } from '../repository/user.repository';
import { OrganizationContext } from '../types/tenant.types';

export class OrganizationService {
  async getUserOrganizationsContext(userId: number): Promise<OrganizationContext[]> {
    const memberships = await organizationRepository.findMembershipsByUserId(userId);
    return memberships.map(m => ({
      organization: m.organization,
      membership: m.membership,
      roles: [m.membership.role],
    }));
  }

  async resolveActiveOrganization(userId: number, requestedOrgId?: number): Promise<OrganizationContext | null> {
    const contexts = await this.getUserOrganizationsContext(userId);
    if (contexts.length === 0) {
      // Auto-create a default org if user has none
      const user = await userRepository.findByEmail(''); // Or wait, let's fetch user name if possible, or create fallback
      const fallbackName = `User ${userId}'s Organization`;
      const slug = `org-user-${userId}-${Date.now()}`;
      const newOrg = await organizationRepository.createOrganization(fallbackName, slug, null, userId);
      const mem = await organizationRepository.findMembership(newOrg.id, userId);
      if (!mem) return null;
      return {
        organization: newOrg,
        membership: mem,
        roles: [mem.role],
      };
    }

    if (requestedOrgId) {
      const match = contexts.find(c => c.organization.id === requestedOrgId);
      if (match) return match;
    }

    return contexts[0]; // Return default / primary organization
  }
}

export const organizationService = new OrganizationService();
