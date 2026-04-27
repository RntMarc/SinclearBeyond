import { NextResponse } from "next/server";
import { requestOtp } from "@/lib/auth/otp";
import { otpRequestLimiter } from "@/lib/auth/rateLimiter";

export async function POST(req) {
  const { email } = await req.json();
  if (!email)
    return NextResponse.json({ error: "email_required" }, { status: 400 });

  try {
    await otpRequestLimiter.consume(email);
  } catch {
    return NextResponse.json({ error: "too_many_requests" }, { status: 429 });
  }

  const result = await requestOtp(email);
  if (!result.ok)
    return NextResponse.json({ error: result.error }, { status: 400 });

  return NextResponse.json({ ok: true });
}
