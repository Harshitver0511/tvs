import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabaseServer";
import { toSessionUser } from "@/app/lib/dal";
import { ensureDefaultRole } from "@/app/lib/services/userAdmin";
import { tvsDb } from "@/app/lib/db";
import { getClientIp } from "@/app/lib/rateLimit";
import { postLoginDestination } from "@/app/lib/roles";

// Called by the login page right after Supabase sign-in. Identity and role come
// only from the verified Supabase session — never from the request body.
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    try {
      await ensureDefaultRole(user);
    } catch (e) {
      console.warn("ensureDefaultRole failed:", e);
    }

    const sessionUser = toSessionUser(user);
    const body = await request.json().catch(() => ({}));
    const redirect = typeof body?.redirect === "string" ? body.redirect : null;

    await tvsDb.logAction(sessionUser.id, sessionUser.role, "LOGIN", "session", sessionUser.id, {
      email: sessionUser.email,
      ip: getClientIp(request),
    });

    return NextResponse.json({
      success: true,
      user: sessionUser,
      destination: postLoginDestination(sessionUser.role, redirect),
    });
  } catch (error) {
    console.error("Session creation error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
