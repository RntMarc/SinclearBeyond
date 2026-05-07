import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { requestOtp } from "@/lib/auth/otp";
import { otpRequestLimiter } from "@/lib/auth/rateLimiter";

export async function POST(req) {
  const t = await getTranslations("Common");
  const { email } = await req.json();
  if (!email)
    return NextResponse.json({ error: t("missingFields") }, { status: 400 });

  try {
    await otpRequestLimiter.consume(email);
  } catch {
    return NextResponse.json({ error: t("tooManyRequests") }, { status: 429 });
  }

  const result = await requestOtp(email);
  if (!result.ok)
    return NextResponse.json({ error: result.error }, { status: 400 });

  return NextResponse.json({ ok: true });
}
