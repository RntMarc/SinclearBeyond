import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/db";
import { travelRelations, users } from "@/lib/db/schema";

export async function GET(req, { params }) {
  const session = await getSession();
  const { id } = await params;

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const participants = await db
      .select({
        id: users.id,
        displayName: users.displayName,
        email: users.email,
      })
      .from(travelRelations)
      .innerJoin(users, eq(travelRelations.userId, users.id))
      .where(eq(travelRelations.tripId, Number(id)));

    return NextResponse.json(participants);
  } catch (error) {
    console.error("[API/Travel/Trips/Participants] GET Error:", error);
    return NextResponse.json(
      { error: "Fehler beim Laden der Teilnehmer." },
      { status: 500 },
    );
  }
}

export async function POST(req, { params }) {
  const session = await getSession();
  const { id } = await params;

  if (!session || !session.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: "UserID ist erforderlich." },
        { status: 400 },
      );
    }

    // Check if already participant
    const [existing] = await db
      .select()
      .from(travelRelations)
      .where(
        and(
          eq(travelRelations.tripId, Number(id)),
          eq(travelRelations.userId, userId),
        ),
      )
      .limit(1);

    if (existing) {
      return NextResponse.json({ ok: true, message: "Bereits Teilnehmer." });
    }

    await db.insert(travelRelations).values({
      tripId: Number(id),
      userId: userId,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[API/Travel/Trips/Participants] POST Error:", error);
    return NextResponse.json(
      { error: "Fehler beim Hinzufügen des Teilnehmers." },
      { status: 500 },
    );
  }
}
