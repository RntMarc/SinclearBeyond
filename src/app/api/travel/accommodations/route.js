import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/db";
import { travelAccommodations } from "@/lib/db/schema";

export async function POST(req) {
  const session = await getSession();

  if (!session || !session.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
      return NextResponse.json(
        { error: "Name, Breitengrad und Längengrad sind erforderlich." },
        { status: 400 },
      );
    }

    const id = crypto.randomUUID();

    await db.insert(travelAccommodations).values({
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
    });

    return NextResponse.json({ ok: true, id });
  } catch (error) {
    console.error("[API/Travel/Accommodations] Error:", error);
    return NextResponse.json(
      { error: "Fehler beim Erstellen der Unterkunft." },
      { status: 500 },
    );
  }
}
