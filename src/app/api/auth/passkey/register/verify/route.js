import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { verifyRegistration } from "@/lib/auth/passkey";
import { getSession } from "@/lib/auth/session";

export async function POST(req) {
  const t = await getTranslations("Common");
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
  }

  try {
    const { body, name } = await req.json();
    const verification = await verifyRegistration(session.sub, body, name);

    if (verification.verified) {
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
