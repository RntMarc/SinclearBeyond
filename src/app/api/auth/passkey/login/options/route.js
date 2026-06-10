import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getAuthenticationOptions } from "@/lib/auth/passkey";
import { passkeyLimiter } from "@/lib/auth/rateLimiter";
import { getClientIp } from "@/lib/utils/ip";

export async function POST() {
  const t = await getTranslations("Common");
  const ip = await getClientIp();

  try {
    await passkeyLimiter.consume(ip);
  } catch {
    return NextResponse.json({ error: t("tooManyRequests") }, { status: 429 });
  }

  try {
    console.log("[Passkey Login Options] Requesting options for IP:", ip);
    const options = await getAuthenticationOptions();
    return NextResponse.json(options);
  } catch (err) {
    console.error("[Passkey Login Options] Error:", err);
    return NextResponse.json({ error: t("error") }, { status: 500 });
  }
}
