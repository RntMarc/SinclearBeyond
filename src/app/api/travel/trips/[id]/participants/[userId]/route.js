import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/db";
import { travelRelations } from "@/lib/db/schema";

export async function PATCH(req, { params }) {
  const t = await getTranslations("Common");
  const session = await getSession();
  const { id, userId } = await params;

  if (!session || !session.isAdmin) {
    return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
  }

  try {
    const { accommodationId } = await req.json();

    await db
      .update(travelRelations)
      .set({ accommodationId: accommodationId || null })
      .where(
        and(eq(travelRelations.tripId, id), eq(travelRelations.userId, userId)),
      );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[API/Travel/Trips/Participants/UserID] PATCH Error:", error);
    return NextResponse.json({ error: t("saveError") }, { status: 500 });
  }
}

export async function DELETE(_req, { params }) {
  const t = await getTranslations("Common");
  const session = await getSession();
  const { id, userId } = await params;

  if (!session || !session.isAdmin) {
    return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
  }

  try {
    await db
      .delete(travelRelations)
      .where(
        and(eq(travelRelations.tripId, id), eq(travelRelations.userId, userId)),
      );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(
      "[API/Travel/Trips/Participants/UserID] DELETE Error:",
      error,
    );
    return NextResponse.json({ error: t("deleteError") }, { status: 500 });
  }
}
