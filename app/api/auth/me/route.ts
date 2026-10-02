import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabaseServer";
import { getSessionUser } from "@/app/lib/dal";

const noStore = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ authenticated: false, user: null }, { headers: noStore });
  }
  return NextResponse.json({ authenticated: true, user }, { headers: noStore });
}

// Sign out: clears the Supabase auth cookies.
export async function POST() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {}
  return NextResponse.json({ success: true, message: "Logged out" }, { headers: noStore });
}
