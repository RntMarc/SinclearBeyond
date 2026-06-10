import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { createSessionToken } from "@/lib/auth/auth";
import { verifyAuthentication } from "@/lib/auth/passkey";
import { passkeyLimiter } from "@/lib/auth/rateLimiter";
import { completeV2AuthFlowIfPresent } from "@/lib/auth/v2Flow";
import { getClientIp } from "@/lib/utils/ip";

export async function POST(req) {
  const t = await getTranslations("Common");
  const ip = await getClientIp();

  try {
    await passkeyLimiter.consume(ip);
  } catch {
    return NextResponse.json({ error: t("tooManyRequests") }, { status: 429 });
  }

  try {
    const body = await req.json();
    console.log("[Passkey Login Verify] Attempting verification");
    const result = await verifyAuthentication(body);

    if (result.verified) {
      const { user, token, refreshToken, expiresIn } = result;
      console.log(
        `[Passkey Login Verify] Verification successful for user: ${user?.id}`,
      );

      const cookieStore = await cookies();

      cookieStore.set("accessToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: expiresIn || 900,
        path: "/",
      });

      if (refreshToken) {
        cookieStore.set("refreshToken", refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 30, // 30 days
          path: "/",
        });
      }

      // Legacy session cookie for compatibility during migration
      cookieStore.set("session", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });

      const v2Flow = await completeV2AuthFlowIfPresent({
        sub: user.id,
        id: user.id,
        email: user.email,
      });
      if (v2Flow?.redirect) {
        return NextResponse.json({ ok: true, redirect: v2Flow.redirect, user });
      }
      return NextResponse.json({ ok: true });
    } else {
      console.warn("[Passkey Login Verify] Verification failed");
      return NextResponse.json({ error: t("error") }, { status: 400 });
    }
  } catch (err) {
    console.error("[Passkey Login Verify] Exception:", err);
    return NextResponse.json(
      { error: err.message || t("error") },
      { status: 500 },
    );
  }
}
