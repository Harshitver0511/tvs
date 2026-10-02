import { NextResponse } from "next/server";
import { getEkycSummary } from "../../lib/services/ekyc-sandbox";
import { ekycRequestSchema } from "../../lib/validations";
import { requireApiRole } from "../../lib/dal";

export async function POST(request: Request) {
  const auth = await requireApiRole();
  if (auth.response) return auth.response;

  try {
    const parsed = ekycRequestSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Validation failed" }, { status: 400 });
    }
    const { name, aadhaarNumber } = parsed.data;

    const result = getEkycSummary(name, aadhaarNumber);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "eKYC verification failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    service: "TVS Credit eKYC Verification",
    mode: "SANDBOX",
    providers: ["Setu AA Gateway", "DigiLocker", "Bank Account Verification"],
    disclaimer: "Running in sandbox mode. Production requires paid API credentials from Setu/Digio.",
  });
}
