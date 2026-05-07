import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { verifyOtp } from "@/lib/auth/otp";
import { otpVerifyLimiter } from "@/lib/auth/rateLimiter";

export async function POST(req) {
  const t = await getTranslations("Common");
  const { email, code } = await req.json();
  if (!email || !code)
    return NextResponse.json({ error: t("missingFields") }, { status: 400 });

  try {
    await otpVerifyLimiter.consume(email);
  } catch {
    return NextResponse.json({ error: t("tooManyRequests") }, { status: 429 });
  }

  const result = await verifyOtp(email, code);
  if (!result.ok)
    return NextResponse.json({ error: result.error }, { status: 401 });

  const res = NextResponse.json({ ok: true, user: result.user });
  res.cookies.set("session", result.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  return res;
}
