import { NextResponse } from "next/server";
import { tvsDb } from "../../../lib/db";
import { requireApiRole } from "../../../lib/dal";
import { canViewApplicant } from "../../../lib/access";
import { getClientIp } from "../../../lib/rateLimit";
import { isStaffRole } from "../../../lib/roles";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiRole();
  if (auth.response) return auth.response;

  const { id } = await params;
  const applicant = await tvsDb.getApplicantById(id);

  // 404 rather than 403 so ids of other farmers' applications aren't confirmed
  if (!applicant || !canViewApplicant(auth.user, applicant)) {
    return NextResponse.json({ error: "Applicant not found" }, { status: 404 });
  }

  // RBI / DPDP: every staff view of borrower PII is audit-logged
  if (isStaffRole(auth.user.role)) {
    await tvsDb.logAction(auth.user.id, auth.user.role, "STAFF_VIEWED_APPLICANT_PII", "application", applicant.id, {
      ip: getClientIp(request),
    });
  }

  return NextResponse.json(applicant, { headers: { "Cache-Control": "no-store" } });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiRole(["admin", "credit_officer"]);
  if (auth.response) return auth.response;

  const { id } = await params;
  const before = await tvsDb.getApplicantById(id);
  const deleted = await tvsDb.deleteApplication(id);

  if (!deleted) {
    return NextResponse.json({ error: `Application ${id} not found` }, { status: 404 });
  }

  await tvsDb.logAction(auth.user.id, auth.user.role, "APPLICATION_DELETED", "application", id.toUpperCase(), {
    ip: getClientIp(request),
    before: before ? { district: before.district, score: before.scoring.score, requestedAmount: before.requestedAmount } : null,
  });

  return NextResponse.json({ success: true, message: `Application ${id} deleted successfully` });
}
