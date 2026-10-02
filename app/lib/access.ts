import "server-only";
import type { Applicant } from "./data";
import type { SessionUser } from "./dal";

// Application-level row access rules (mirrors drizzle/rls-policies.sql):
//   admin, credit_officer → every application
//   field_officer         → applications in their assigned district
//   farmer                → only applications linked to their own account

export function canViewApplicant(user: SessionUser, applicant: Applicant): boolean {
  switch (user.role) {
    case "admin":
    case "credit_officer":
      return true;
    case "field_officer":
      return !!user.district && applicant.district.toLowerCase() === user.district.toLowerCase();
    case "farmer":
      return !!applicant.farmerId && applicant.farmerId === user.id;
    default:
      return false;
  }
}

export function applicantsVisibleTo(user: SessionUser, all: Applicant[]): Applicant[] {
  return all.filter((a) => canViewApplicant(user, a));
}
