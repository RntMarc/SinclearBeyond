import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { verifyRegistration } from "@/lib/auth/passkey";
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
    const { body, name } = await req.json();
    console.log(
      `[Passkey Register Verify] Attempting verification for user: ${session.sub}`,
    );
    const verification = await verifyRegistration(session.sub, body, name);

    if (verification.verified) {
      console.log(`[Passkey Register Verify] Success for user: ${session.sub}`);
      return NextResponse.json({ ok: true });
    } else {
      console.warn(
        `[Passkey Register Verify] Verification failed for user: ${session.sub}`,
      );
      return NextResponse.json({ error: t("error") }, { status: 400 });
    }
  } catch (err) {
    console.error(
      `[Passkey Register Verify] Exception for user ${session.sub}:`,
      err,
    );
    return NextResponse.json(
      { error: err.message || t("error") },
      { status: 500 },
    );
  }
}
