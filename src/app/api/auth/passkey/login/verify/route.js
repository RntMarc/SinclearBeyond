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
    const result = await verifyAuthentication(body);

    if (result.verified) {
      const { user } = result;

      const jwt = await createSessionToken(user);

      const cookieStore = await cookies();
      cookieStore.set("session", jwt, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });

      const v2Flow = await completeV2AuthFlowIfPresent();
      if (v2Flow?.redirect) {
        return NextResponse.json({ ok: true, redirect: v2Flow.redirect, user });
      }
      return NextResponse.json({ ok: true });
    } else {
      return NextResponse.json({ error: t("error") }, { status: 400 });
    }
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err.message || t("error") },
      { status: 500 },
    );
  }
}
