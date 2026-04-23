import { requestOtp } from "@/lib/auth/otp";
import { NextResponse } from "next/server";

export async function POST(req) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "email_required" }, { status: 400 });

  const result = await requestOtp(email);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

  return NextResponse.json({ ok: true });
}
