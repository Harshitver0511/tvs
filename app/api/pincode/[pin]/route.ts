import { NextResponse } from "next/server";
import { lookupPincode } from "../../../lib/services/pincode";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ pin: string }> }
) {
  const { pin } = await params;
  if (!/^[1-9]\d{5}$/.test(pin)) {
    return NextResponse.json({ error: "Pincode must be 6 digits" }, { status: 400 });
  }
  const result = await lookupPincode(pin);

  if (!result) {
    return NextResponse.json(
      { error: "Invalid or unfound Indian pincode" },
      { status: 404 }
    );
  }

  return NextResponse.json(result);
}
