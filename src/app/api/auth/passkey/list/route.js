import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { phpFetch } from "@/lib/api/phpClient";
import { passkeyLimiter } from "@/lib/auth/rateLimiter";
import { getSession } from "@/lib/auth/session";

export async function GET() {
  const t = await getTranslations("Common");
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
  }

  try {
    await passkeyLimiter.consume(session.sub);
  } catch {
    return NextResponse.json({ error: t("tooManyRequests") }, { status: 429 });
  }

  const result = await phpFetch("/auth/passkey/list");

  if (!result.ok) {
    console.error(`[Passkey List] PHP API Error: ${result.error}`);
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  return NextResponse.json(result.data?.data || []);
}
