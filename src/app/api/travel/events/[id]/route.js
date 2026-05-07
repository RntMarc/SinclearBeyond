import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/db";
import { travelEvents } from "@/lib/db/schema";

export async function PATCH(req, { params }) {
  const t = await getTranslations("Common");
  const session = await getSession();
  const { id } = await params;

  if (!session || !session.isAdmin) {
    return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
  }

  try {
    const data = await req.json();
    const updateData = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.start !== undefined) updateData.start = new Date(data.start);
    if (data.end !== undefined) updateData.end = new Date(data.end);
    if (data.hasTickets !== undefined) updateData.hasTickets = data.hasTickets;
    if (data.ticketId !== undefined) updateData.ticketId = data.ticketId;
    if (data.ticketUrl !== undefined) updateData.ticketUrl = data.ticketUrl;
    if (data.url !== undefined) updateData.url = data.url;
    if (data.image !== undefined) updateData.image = data.image;
    if (data.organizer !== undefined) updateData.organizer = data.organizer;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.latitude !== undefined)
      updateData.latitude = data.latitude ? parseFloat(data.latitude) : null;
    if (data.longitude !== undefined)
      updateData.longitude = data.longitude ? parseFloat(data.longitude) : null;
    if (data.osmId !== undefined)
      updateData.osmId = data.osmId ? BigInt(data.osmId) : null;

    await db
      .update(travelEvents)
      .set(updateData)
      .where(eq(travelEvents.id, id));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[API/Travel/Events] PATCH Error:", error);
    return NextResponse.json({ error: t("saveError") }, { status: 500 });
  }
}

export async function DELETE(_req, { params }) {
  const t = await getTranslations("Common");
  const session = await getSession();
  const { id } = await params;

  if (!session || !session.isAdmin) {
    return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
  }

  try {
    await db.delete(travelEvents).where(eq(travelEvents.id, id));
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[API/Travel/Events] DELETE Error:", error);
    return NextResponse.json({ error: t("deleteError") }, { status: 500 });
  }
}
