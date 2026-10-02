import { NextResponse } from "next/server";
import { tvsDb } from "../../lib/db";
import { consentGrantSchema, consentRevokeSchema } from "../../lib/validations";
import { getClientIp } from "../../lib/rateLimit";
import { requireApiRole } from "../../lib/dal";

// DPDP consent management. The data principal is always the signed-in user;
// a user can only see, grant or withdraw their own consents.

export async function GET() {
  const auth = await requireApiRole();
  if (auth.response) return auth.response;

  const records = await tvsDb.getConsentsForUser(auth.user.id);
  return NextResponse.json(
    { success: true, consents: records },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(request: Request) {
  const auth = await requireApiRole();
  if (auth.response) return auth.response;

  const parsed = consentGrantSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.issues.map((i) => i.message) },
      { status: 400 }
    );
  }

  const record = await tvsDb.saveConsent(
    auth.user.id,
    parsed.data.purpose,
    getClientIp(request),
    request.headers.get("user-agent") || "WebClient"
  );
  return NextResponse.json({ success: true, consent: record, message: "DPDP consent recorded" });
}

export async function PATCH(request: Request) {
  const auth = await requireApiRole();
  if (auth.response) return auth.response;

  const parsed = consentRevokeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.issues.map((i) => i.message) },
      { status: 400 }
    );
  }

  const { purpose, reason } = parsed.data;
  const result = await tvsDb.revokeConsent(auth.user.id, purpose, reason);
  return NextResponse.json({
    success: true,
    revokedCount: result.revokedCount,
    message: `Consent for purpose '${purpose}' revoked in compliance with DPDP Act 2023 Sec 6(4).`,
  });
}
