import { apiClient } from '../lib/api';

export interface Organization {
  id: number;
  name: string;
  slug: string;
  billing_email: string | null;
}

export interface OrganizationMember {
  role: string;
  joined_at: string;
}

export interface OrganizationContext {
  organization: Organization;
  membership: OrganizationMember;
  roles: string[];
}

export const organizationService = {
  getMyOrganizations: () =>
    apiClient<{
      activeContext: OrganizationContext;
      organizations: OrganizationContext[];
    }>('/organizations/me'),
};
