import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/db";
import { travelTrips } from "@/lib/db/schema";

export async function PATCH(req, { params }) {
  const session = await getSession();
  const { id } = await params;

  if (!session || !session.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const updateData = {};
    if (body.name) updateData.name = body.name;
    if (body.description !== undefined)
      updateData.description = body.description;
    if (body.start) updateData.start = new Date(body.start);
    if (body.end) updateData.end = new Date(body.end);

    await db
      .update(travelTrips)
      .set(updateData)
      .where(eq(travelTrips.id, Number(id)));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[API/Travel/Trips/ID] PATCH Error:", error);
    return NextResponse.json(
      { error: "Fehler beim Aktualisieren der Reise." },
      { status: 500 },
    );
  }
}

export async function DELETE(req, { params }) {
  const session = await getSession();
  const { id } = await params;

  if (!session || !session.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await db.delete(travelTrips).where(eq(travelTrips.id, Number(id)));
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[API/Travel/Trips/ID] DELETE Error:", error);
    return NextResponse.json(
      { error: "Fehler beim Löschen der Reise." },
      { status: 500 },
    );
  }
}
