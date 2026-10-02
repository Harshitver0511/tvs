import { NextResponse } from "next/server";
import { tvsDb } from "../../lib/db";
import { dataErasureSchema } from "../../lib/validations";
import { getClientIp } from "../../lib/rateLimit";
import { requireApiRole } from "../../lib/dal";

// DPDP Act 2023 §12 — right to erasure of the signed-in user's own data.
export async function POST(request: Request) {
  const auth = await requireApiRole();
  if (auth.response) return auth.response;

  const parsed = dataErasureSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.issues.map((i) => i.message) },
      { status: 400 }
    );
  }

  try {
    const result = await tvsDb.eraseUserData(auth.user.id, parsed.data.reason);
    await tvsDb.logAction(auth.user.id, auth.user.role, "DPDP_SECTION_12_ERASURE", "user_records", auth.user.id, {
      ip: getClientIp(request),
      erasedApplications: result.erasedApplications,
    });
    return NextResponse.json({
      success: true,
      erasedCount: result.erasedApplications,
      message: result.message,
    });
  } catch (error) {
    console.error("Erasure error:", error);
    return NextResponse.json({ error: "Failed to process data erasure request" }, { status: 500 });
  }
}
