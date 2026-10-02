import { NextResponse } from "next/server";
import { tvsDb } from "../../lib/db";
import { creditOfficerOverrideSchema } from "../../lib/validations";
import { getClientIp } from "../../lib/rateLimit";
import { requireApiRole } from "../../lib/dal";

// Audit trail is readable by credit officers and the admin.
export async function GET() {
  const auth = await requireApiRole(["credit_officer", "admin"]);
  if (auth.response) return auth.response;

  try {
    const logs = await tvsDb.getAuditLogs();
    return NextResponse.json(
      { success: true, totalCount: logs.length, logs },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json({ error: "Failed to retrieve audit trail" }, { status: 500 });
  }
}

// Credit-officer override of a model decision. The actor is always the signed-in
// officer — clients cannot choose who an audit entry is attributed to.
export async function POST(request: Request) {
  const auth = await requireApiRole(["credit_officer", "admin"]);
  if (auth.response) return auth.response;

  const parsed = creditOfficerOverrideSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.issues.map((i) => i.message) },
      { status: 400 }
    );
  }

  const applicant = await tvsDb.getApplicantById(parsed.data.applicationId);
  if (!applicant) {
    return NextResponse.json({ error: "Applicant not found" }, { status: 404 });
  }

  const entry = await tvsDb.logAction(
    auth.user.id,
    auth.user.role,
    "CREDIT_OFFICER_OVERRIDE",
    "application",
    applicant.id,
    {
      ip: getClientIp(request),
      officerEmail: auth.user.email,
      before: { score: applicant.scoring.score, riskTier: applicant.scoring.riskTier },
      targetDecision: parsed.data.targetDecision,
      rationale: parsed.data.overrideNote,
    }
  );

  return NextResponse.json({
    success: true,
    entry,
    message: "Override committed to immutable audit trail under RBI Digital Lending guidelines.",
  });
}
