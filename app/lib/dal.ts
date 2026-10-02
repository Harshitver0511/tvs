import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { createClient } from "./supabaseServer";
import { roleFromAppMetadata, type UserRole } from "./roles";

// Data Access Layer: the one place that turns a request's Supabase session into
// an authenticated user + role. Every staff page, route handler and server
// action authorizes through here — proxy.ts is only an optimistic first check.

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  /** Field officers are scoped to one district (set by the admin). */
  district?: string;
}

export function toSessionUser(user: SupabaseUser): SessionUser {
  const email = (user.email || "").toLowerCase();
  const meta = user.user_metadata || {};
  const appMeta = user.app_metadata || {};
  return {
    id: user.id,
    email,
    name: (meta.name as string) || (meta.full_name as string) || email.split("@")[0] || "User",
    role: roleFromAppMetadata(appMeta),
    district: typeof appMeta.district === "string" && appMeta.district ? appMeta.district : undefined,
  };
}

/** Current user for this request, verified with Supabase Auth (not just the cookie). */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error || !user) return null;
    return toSessionUser(user);
  } catch {
    return null;
  }
});

/** For Server Components: redirect to login unless the user has one of `roles`. */
export async function requirePageRole(roles: UserRole[], returnTo: string): Promise<SessionUser> {
  const user = await getSessionUser();
  const loginRole = roles.includes("farmer") ? "farmer" : "staff";
  if (!user) {
    redirect(`/login?role=${loginRole}&redirect=${encodeURIComponent(returnTo)}`);
  }
  if (!roles.includes(user.role)) {
    redirect(`/login?role=${loginRole}&denied=1&redirect=${encodeURIComponent(returnTo)}`);
  }
  return user;
}

type ApiAuthResult = { user: SessionUser; response?: never } | { user?: never; response: NextResponse };

/**
 * For Route Handlers. Usage:
 *   const auth = await requireApiRole(["admin"]);
 *   if (auth.response) return auth.response;
 *   auth.user ...
 * Pass no roles to allow any signed-in user.
 */
export async function requireApiRole(roles?: UserRole[]): Promise<ApiAuthResult> {
  const user = await getSessionUser();
  if (!user) {
    return { response: NextResponse.json({ error: "Authentication required" }, { status: 401 }) };
  }
  if (roles && !roles.includes(user.role)) {
    return { response: NextResponse.json({ error: "You do not have permission for this action" }, { status: 403 }) };
  }
  return { user };
}
