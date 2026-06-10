import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { requestOtp } from "@/lib/auth/otp";
import { otpRequestLimiter } from "@/lib/auth/rateLimiter";

export async function POST(req) {
  const t = await getTranslations("Common");
  const { email } = await req.json();

  console.log(`[OTP Request] Request for email: ${email}`);

  if (!email) {
    console.warn("[OTP Request] Missing email field");
    return NextResponse.json({ error: t("missingFields") }, { status: 400 });
  }

  try {
    await otpRequestLimiter.consume(email);
  } catch {
    console.warn(`[OTP Request] Rate limit exceeded for email: ${email}`);
    return NextResponse.json({ error: t("tooManyRequests") }, { status: 429 });
  }

  const result = await requestOtp(email);
  if (!result.ok) {
    console.error(`[OTP Request] Failed for email: ${email}`, result.error);
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  console.log(`[OTP Request] Success for email: ${email}`);
  return NextResponse.json({ ok: true });
}
