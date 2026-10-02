import "server-only";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { supabaseAdmin } from "../supabaseServer";
import { tvsDb } from "../db";
import { roleFromAppMetadata, type AssignableRole, type UserRole } from "../roles";
import type { SessionUser } from "../dal";

// Staff identity & role administration. All writes go through the service-role
// client so roles land in app_metadata, which end users cannot modify.

export interface ManagedUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  district?: string;
  invited: boolean;
  emailConfirmed: boolean;
  lastSignInAt?: string;
  createdAt: string;
}

export class UserAdminError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

function requireAdminClient() {
  if (!supabaseAdmin) {
    throw new UserAdminError("SUPABASE_SERVICE_ROLE_KEY is not configured on the server", 503);
  }
  return supabaseAdmin;
}

function toManagedUser(u: SupabaseUser): ManagedUser {
  const meta = u.user_metadata || {};
  const appMeta = u.app_metadata || {};
  const email = (u.email || "").toLowerCase();
  return {
    id: u.id,
    email,
    name: (meta.name as string) || (meta.full_name as string) || email.split("@")[0],
    role: roleFromAppMetadata(appMeta),
    district: typeof appMeta.district === "string" && appMeta.district ? appMeta.district : undefined,
    invited: !!u.invited_at && !u.last_sign_in_at,
    emailConfirmed: !!u.email_confirmed_at,
    lastSignInAt: u.last_sign_in_at || undefined,
    createdAt: u.created_at,
  };
}

export async function listManagedUsers(): Promise<ManagedUser[]> {
  const admin = requireAdminClient();
  const all: ManagedUser[] = [];
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 500 });
    if (error) throw new UserAdminError(error.message, 502);
    all.push(...data.users.map(toManagedUser));
    if (data.users.length < 500) break;
  }
  const order: Record<UserRole, number> = { admin: 0, credit_officer: 1, field_officer: 2, farmer: 3 };
  return all.sort((a, b) => order[a.role] - order[b.role] || a.email.localeCompare(b.email));
}

/**
 * New self-registered accounts have no app_metadata.role yet. Stamp them as
 * "farmer" so the admin console shows an explicit role. Never upgrades anyone.
 */
export async function ensureDefaultRole(user: SupabaseUser): Promise<void> {
  if (!supabaseAdmin || user.app_metadata?.role) return;
  await supabaseAdmin.auth.admin.updateUserById(user.id, {
    app_metadata: { ...user.app_metadata, role: "farmer" },
  });
}

export async function setUserRole(
  actor: SessionUser,
  targetId: string,
  role: AssignableRole,
  district: string | undefined
): Promise<ManagedUser> {
  const admin = requireAdminClient();
  if (targetId === actor.id) {
    throw new UserAdminError("The admin account's role cannot be changed from the console", 400);
  }

  const { data, error } = await admin.auth.admin.getUserById(targetId);
  if (error || !data.user) throw new UserAdminError("User not found", 404);
  const before = toManagedUser(data.user);
  if (before.role === "admin") {
    throw new UserAdminError("The admin account cannot be modified from the console", 400);
  }

  // GoTrue merges app_metadata keys, so clear district with null rather than omitting it.
  const appMetadata: Record<string, unknown> = {
    ...data.user.app_metadata,
    role,
    district: role === "field_officer" ? district || null : null,
  };

  const { data: updated, error: updateError } = await admin.auth.admin.updateUserById(targetId, {
    app_metadata: appMetadata,
  });
  if (updateError || !updated.user) throw new UserAdminError(updateError?.message || "Update failed", 502);

  const after = toManagedUser(updated.user);
  await tvsDb.mirrorUserRole(targetId, role);
  await tvsDb.logAction(actor.id, actor.role, "USER_ROLE_CHANGED", "user", targetId, {
    targetEmail: after.email,
    before: { role: before.role, district: before.district ?? null },
    after: { role: after.role, district: after.district ?? null },
  });
  return after;
}

export async function inviteStaffUser(
  actor: SessionUser,
  input: { email: string; name: string; role: AssignableRole; district?: string },
  redirectTo: string
): Promise<ManagedUser> {
  const admin = requireAdminClient();
  const email = input.email.toLowerCase();

  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { name: input.name },
    redirectTo,
  });
  if (error || !data.user) {
    const msg = error?.message || "Invite failed";
    const exists = /already (been )?registered|already exists/i.test(msg);
    throw new UserAdminError(
      exists ? "An account with this email already exists — change its role in the table instead" : msg,
      exists ? 409 : 502
    );
  }

  const appMetadata: Record<string, unknown> = { ...data.user.app_metadata, role: input.role };
  if (input.role === "field_officer" && input.district) appMetadata.district = input.district;
  const { data: updated, error: updateError } = await admin.auth.admin.updateUserById(data.user.id, {
    app_metadata: appMetadata,
  });
  if (updateError || !updated.user) throw new UserAdminError(updateError?.message || "Role assignment failed", 502);

  await tvsDb.logAction(actor.id, actor.role, "STAFF_INVITED", "user", data.user.id, {
    targetEmail: email,
    role: input.role,
    district: input.district ?? null,
  });
  return toManagedUser(updated.user);
}
