import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { registerUser } from "@/lib/auth/register";

export async function POST(req) {
  const t = await getTranslations("Common");
  const { email, displayName } = await req.json();

  if (!email || !displayName?.trim()) {
    return NextResponse.json({ error: t("missingFields") }, { status: 400 });
  }

  const result = await registerUser(email, displayName);

  if (!result.ok) {
    const status = result.error === "domain_not_allowed" ? 403 : 409;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({ ok: true });
}
