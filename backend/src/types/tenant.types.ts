export type RoleType = 'OWNER' | 'ADMIN' | 'DEVELOPER' | 'BILLING_MANAGER' | 'VIEWER' | 'SUPPORT';

export interface Organization {
  id: number;
  name: string;
  slug: string;
  billing_email: string | null;
  stripe_customer_id?: string;
  created_at: Date;
  updated_at: Date;
}

export interface OrganizationMember {
  id: number;
  organization_id: number;
  user_id: number;
  role: RoleType;
  joined_at: Date;
}

export interface OrganizationContext {
  organization: Organization;
  membership: OrganizationMember;
  roles: RoleType[];
}
