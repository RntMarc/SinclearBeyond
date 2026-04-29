import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/db";
import { travelRelations } from "@/lib/db/schema";

export async function DELETE(req, { params }) {
  const session = await getSession();
  const { id, userId } = await params;

  if (!session || !session.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await db
      .delete(travelRelations)
      .where(
        and(
          eq(travelRelations.tripId, Number(id)),
          eq(travelRelations.userId, userId),
        ),
      );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(
      "[API/Travel/Trips/Participants/UserID] DELETE Error:",
      error,
    );
    return NextResponse.json(
      { error: "Fehler beim Entfernen des Teilnehmers." },
      { status: 500 },
    );
  }
}
