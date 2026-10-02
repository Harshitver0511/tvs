import { NextResponse } from "next/server";
import { requireApiRole } from "@/app/lib/dal";
import { roleUpdateSchema, staffInviteSchema } from "@/app/lib/validations";
import {
  inviteStaffUser,
  listManagedUsers,
  setUserRole,
  UserAdminError,
} from "@/app/lib/services/userAdmin";

// Admin-only staff directory & RBAC administration.
//   GET   → all accounts with their role
//   PATCH → { userId, role, district? } assign farmer / field_officer / credit_officer
//   POST  → { email, name, role, district? } invite a staff member by email

function errorResponse(e: unknown) {
  if (e instanceof UserAdminError) {
    return NextResponse.json({ error: e.message }, { status: e.status });
  }
  console.error("[admin/users]", e);
  return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
}

function validationError(issues: { path: PropertyKey[]; message: string }[]) {
  return NextResponse.json(
    { error: issues[0]?.message || "Validation failed", details: issues.map((i) => `${i.path.join(".")}: ${i.message}`) },
    { status: 400 }
  );
}

export async function GET() {
  const auth = await requireApiRole(["admin"]);
  if (auth.response) return auth.response;
  try {
    const users = await listManagedUsers();
    return NextResponse.json({ users }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function PATCH(request: Request) {
  const auth = await requireApiRole(["admin"]);
  if (auth.response) return auth.response;

  const parsed = roleUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error.issues);

  try {
    const { userId, role, district } = parsed.data;
    const user = await setUserRole(auth.user, userId, role, district);
    return NextResponse.json({ success: true, user });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function POST(request: Request) {
  const auth = await requireApiRole(["admin"]);
  if (auth.response) return auth.response;

  const parsed = staffInviteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error.issues);

  try {
    const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
    const user = await inviteStaffUser(auth.user, parsed.data, `${origin}/auth/set-password`);
    return NextResponse.json({ success: true, user }, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
