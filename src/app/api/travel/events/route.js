import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/db";
import { eventRelations, travelEvents } from "@/lib/db/schema";

export async function POST(req) {
  const t = await getTranslations("Common");
  const session = await getSession();

  if (!session || !session.isAdmin) {
    return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
  }

  try {
    const data = await req.json();
    const {
      tripId,
      name,
      description,
      start,
      end,
      hasTickets,
      ticketId,
      ticketUrl,
      url,
      image,
      organizer,
      address,
      latitude,
      longitude,
      osmId,
      participantIds, // New field
    } = data;

    if (!name || !start || !end) {
      return NextResponse.json({ error: t("missingFields") }, { status: 400 });
    }

    const id = crypto.randomUUID();

    await db.insert(travelEvents).values({
      id,
      tripId: tripId || null,
      name,
      description: description || null,
      start: new Date(start),
      end: new Date(end),
      hasTickets: hasTickets || "0",
      ticketId: ticketId || null,
      ticketUrl: ticketUrl || null,
      url: url || null,
      image: image || null,
      organizer: organizer || null,
      address: address || null,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      osmId: osmId ? BigInt(osmId) : null,
    });

    if (participantIds && Array.isArray(participantIds)) {
      for (const userId of participantIds) {
        await db.insert(eventRelations).values({
          id: crypto.randomUUID(),
          eventId: id,
          userId,
          createdAt: new Date(),
        });
      }
    }

    return NextResponse.json({ ok: true, id });
  } catch (error) {
    console.error("[API/Travel/Events] POST Error:", error);
    return NextResponse.json({ error: t("saveError") }, { status: 500 });
  }
}
