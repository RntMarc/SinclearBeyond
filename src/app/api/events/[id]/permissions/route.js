import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth/session";
import { phpFetch } from "@/lib/api/phpClient";

export async function GET(_req, { params }) {
  const t = await getTranslations("Common");
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: t("unauthorized") }, { status: 401 });

  const { id } = await params;

  const result = await phpFetch(`/events/${id}/permissions`);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error || t("dbError") },
      { status: result.status || 500 },
    );
  }

  return NextResponse.json(result.data || []);
}
