import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth/session";
import { db, safeQuery } from "@/lib/db/db";
import { travelAccommodations } from "@/lib/db/schema";

export async function GET(_req) {
  const t = await getTranslations("Common");
  const session = await getSession();

  if (!session || !session.isAdmin) {
    return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
  }

  try {
    const { data: accommodations, error: loadError } = await safeQuery(
      db.select().from(travelAccommodations).orderBy(travelAccommodations.name),
    );

    if (loadError) throw loadError;

    return NextResponse.json(accommodations || []);
  } catch (error) {
    console.error("[API/Travel/Accommodations] GET Error:", error);
    return NextResponse.json({ error: t("loadError") }, { status: 500 });
  }
}

export async function POST(req) {
  const t = await getTranslations("Common");
  const session = await getSession();

  if (!session || !session.isAdmin) {
    return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
  }

  try {
    const {
      name,
      description,
      address,
      osmId,
      latitude,
      longitude,
      phone,
      mail,
      isHotel,
    } = await req.json();

    if (!name || latitude === undefined || longitude === undefined) {
      return NextResponse.json({ error: t("missingFields") }, { status: 400 });
    }

    const id = crypto.randomUUID();

    const { error: insertError } = await safeQuery(
      db.insert(travelAccommodations).values({
        id,
        name,
        description: description || null,
        address: address || null,
        osmId: osmId ? BigInt(osmId) : null,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        phone: phone || null,
        mail: mail || null,
        isHotel: isHotel ? 1 : 0,
      }),
    );

    if (insertError) throw insertError;

    return NextResponse.json({ ok: true, id });
  } catch (error) {
    console.error("[API/Travel/Accommodations] Error:", error);
    return NextResponse.json({ error: t("saveError") }, { status: 500 });
  }
}
