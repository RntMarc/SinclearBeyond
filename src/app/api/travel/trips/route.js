import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth/session";
import { phpFetch } from "@/lib/api/phpClient";

export async function POST(req) {
  const t = await getTranslations("Common");
  const session = await getSession();

  if (!session?.isAdmin) {
    return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
  }

  try {
    const { name, description, start, end } = await req.json();

    if (!name || !start || !end) {
      return NextResponse.json({ error: t("missingFields") }, { status: 400 });
    }

    const result = await phpFetch("/travel/trips", {
      method: "POST",
      body: { name, description: description || null, start, end },
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error || t("saveError") }, { status: result.status || 500 });
    }

    return NextResponse.json({ ok: true, id: result.data?.id });
  } catch (error) {
    console.error("[API/Travel/Trips] Error:", error);
    return NextResponse.json({ error: t("saveError") }, { status: 500 });
  }
}
