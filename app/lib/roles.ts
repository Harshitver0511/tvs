// Role model shared by server and client code (no secrets here).
//
// Source of truth for a user's role is Supabase `app_metadata.role`, which only
// the service-role key can write. `user_metadata` is user-editable and is never
// trusted for authorization.

export const USER_ROLES = ["farmer", "field_officer", "credit_officer", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const STAFF_ROLES: UserRole[] = ["field_officer", "credit_officer", "admin"];

// Roles the admin may hand out. "admin" is deliberately excluded: there is exactly
// one admin, created with `scripts/create-admin.ts`.
export const ASSIGNABLE_ROLES = ["farmer", "field_officer", "credit_officer"] as const;
export type AssignableRole = (typeof ASSIGNABLE_ROLES)[number];

export const ROLE_LABELS: Record<UserRole, string> = {
  farmer: "Farmer",
  field_officer: "Field Officer",
  credit_officer: "Credit Officer",
  admin: "Admin",
};

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && (USER_ROLES as readonly string[]).includes(value);
}

export function isStaffRole(role: UserRole | null | undefined): boolean {
  return !!role && STAFF_ROLES.includes(role);
}

/** Resolve a role from Supabase app_metadata. Unknown/missing → farmer. */
export function roleFromAppMetadata(appMetadata: Record<string, unknown> | null | undefined): UserRole {
  const role = appMetadata?.role;
  return isUserRole(role) ? role : "farmer";
}

/** Where a user lands after login when no explicit redirect applies. */
export function homeForRole(role: UserRole): string {
  if (role === "admin") return "/admin/roles";
  if (role === "farmer") return "/apply";
  return "/staff";
}

/** Can `role` open `path`? Mirrors the checks in proxy.ts and the DAL. */
export function canAccessPath(role: UserRole, path: string): boolean {
  if (path.startsWith("/admin")) return role === "admin";
  if (path.startsWith("/staff") || path.startsWith("/monitoring")) return isStaffRole(role);
  return true;
}

/** Pick a safe post-login destination: same-origin relative path the role may open. */
export function postLoginDestination(role: UserRole, redirect: string | null | undefined): string {
  const safe =
    redirect &&
    redirect.startsWith("/") &&
    !redirect.startsWith("//") &&
    !redirect.startsWith("/login") &&
    !redirect.startsWith("/auth") &&
    redirect !== "/";
  return safe && canAccessPath(role, redirect) ? redirect : homeForRole(role);
}
