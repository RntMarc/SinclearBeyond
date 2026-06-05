import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth/session";
import { getProfileData } from "@/lib/profile/profile";

export async function GET() {
  const t = await getTranslations("Common");
  const session = await getSession();
  if (!session?.sub) {
    return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
  }

  const data = await getProfileData(session);
  if (!data) {
    return NextResponse.json({ error: t("notFound") }, { status: 404 });
  }

  return NextResponse.json(data);
}
