import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth/session";
import { db, safeQuery } from "@/lib/db/db";
import { travelTrips } from "@/lib/db/schema";

export async function POST(req) {
  const t = await getTranslations("Common");
  const session = await getSession();

  if (!session || !session.isAdmin) {
    return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
  }

  try {
    const { name, description, start, end } = await req.json();

    if (!name || !start || !end) {
      return NextResponse.json({ error: t("missingFields") }, { status: 400 });
    }

    const id = crypto.randomUUID();

    await safeQuery(
      db.insert(travelTrips).values({
        id,
        name,
        description: description || null,
        start: new Date(start),
        end: new Date(end),
      }),
    );

    return NextResponse.json({ ok: true, id });
  } catch (error) {
    console.error("[API/Travel/Trips] Error:", error);
    return NextResponse.json({ error: t("saveError") }, { status: 500 });
  }
}
