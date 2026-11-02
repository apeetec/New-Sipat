export type UserRole = "admin" | "collaborator";

export interface AuthUser {
  id: string;
  organizationId: string;
  campaignId: string;
  role: UserRole;
  employeeNumber: string;
  displayName: string;
}
