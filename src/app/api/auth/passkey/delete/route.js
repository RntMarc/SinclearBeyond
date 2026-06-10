import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { phpFetch } from "@/lib/api/phpClient";
import { passkeyLimiter } from "@/lib/auth/rateLimiter";
import { getSession } from "@/lib/auth/session";

export async function POST(req) {
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

  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: t("missingFields") }, { status: 400 });
    }

    const result = await phpFetch(`/auth/passkey/${id}`, {
      method: "DELETE",
    });

    if (!result.ok) {
      console.error(`[Passkey Delete] PHP API Error: ${result.error}`);
      return NextResponse.json(
        { error: result.error },
        { status: result.status },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[Passkey Delete] Exception:", err);
    return NextResponse.json({ error: t("error") }, { status: 500 });
  }
}
