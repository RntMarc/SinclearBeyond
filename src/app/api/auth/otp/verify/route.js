import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { verifyOtp } from "@/lib/auth/otp";
import { otpVerifyLimiter } from "@/lib/auth/rateLimiter";
import { completeV2AuthFlowIfPresent } from "@/lib/auth/v2Flow";

export async function POST(req) {
  const t = await getTranslations("Common");
  const { email, code } = await req.json();

  console.log(`[OTP Verify] Attempt for email: ${email}`);

  if (!email || !code) {
    console.warn("[OTP Verify] Missing fields", { email, hasCode: !!code });
    return NextResponse.json({ error: t("missingFields") }, { status: 400 });
  }

  try {
    await otpVerifyLimiter.consume(email);
  } catch {
    console.warn(`[OTP Verify] Rate limit exceeded for email: ${email}`);
    return NextResponse.json({ error: t("tooManyRequests") }, { status: 429 });
  }

  const result = await verifyOtp(email, code);
  if (!result.ok) {
    console.error(`[OTP Verify] Failed for email: ${email}`, result.error);
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  console.log(
    `[OTP Verify] Success for email: ${email}, userId: ${result.user?.id}`,
  );

  const res = NextResponse.json({ ok: true, user: result.user });

  res.cookies.set("accessToken", result.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: result.expiresIn || 900,
    path: "/",
  });

  if (result.refreshToken) {
    res.cookies.set("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 90,
      path: "/",
    });
  }

  // Legacy session cookie for compatibility during migration
  res.cookies.set("session", result.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  const v2Flow = await completeV2AuthFlowIfPresent({
    sub: result.user.id,
    id: result.user.id,
    email: result.user.email,
  });
  if (v2Flow?.redirect) {
    return NextResponse.json({
      ok: true,
      redirect: v2Flow.redirect,
      user: result.user,
    });
  }
  return res;
}
