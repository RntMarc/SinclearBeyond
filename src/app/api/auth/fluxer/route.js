import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
// TODO: Fluxer OAuth
export async function GET() {
  const t = await getTranslations("Common");
  return NextResponse.json({ error: t("notImplemented") }, { status: 501 });
}
