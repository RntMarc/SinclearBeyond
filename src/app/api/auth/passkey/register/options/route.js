import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getRegistrationOptions } from "@/lib/auth/passkey";
import { passkeyLimiter } from "@/lib/auth/rateLimiter";
import { getSession } from "@/lib/auth/session";
import { phpFetch } from "@/lib/api/phpClient";

export async function POST() {
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

  const userRes = await phpFetch(`/users/${session.sub}`);
  if (!userRes.ok) {
    return NextResponse.json({ error: t("notFound") }, { status: 404 });
  }

  const user = userRes.data;

  try {
    console.log(
      `[Passkey Register Options] Requesting options for user: ${user.id}`,
    );
    const options = await getRegistrationOptions(user);
    return NextResponse.json(options);
  } catch (err) {
    console.error("[Passkey Register Options] Error:", err);
    return NextResponse.json({ error: t("error") }, { status: 500 });
  }
}
