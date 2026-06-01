import crypto from "node:crypto";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth/session";
import { db, safeQuery } from "@/lib/db/db";
import { travelRelations, users } from "@/lib/db/schema";
import { sendNotification } from "@/lib/notifications/service";

export async function GET(_req, { params }) {
  const t = await getTranslations("Common");
  const session = await getSession();
  const { id } = await params;

  if (!session) {
    return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
  }

  try {
    const { data: participants, error: participantsError } = await safeQuery(
      db
        .select({
          id: users.id,
          displayName: users.displayName,
          email: users.email,
        })
        .from(travelRelations)
        .innerJoin(users, eq(travelRelations.userId, users.id))
        .where(eq(travelRelations.tripId, id)),
    );

    if (participantsError) throw participantsError;

    return NextResponse.json(participants || []);
  } catch (error) {
    console.error("[API/Travel/Trips/Participants] GET Error:", error);
    return NextResponse.json({ error: t("loadError") }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  const t = await getTranslations("Common");
  const session = await getSession();
  const { id } = await params;

  if (!session || !session.isAdmin) {
    return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
  }

  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: t("missingFields") }, { status: 400 });
    }

    const { data: existingData, error: existingError } = await safeQuery(
      db
        .select()
        .from(travelRelations)
        .where(
          and(
            eq(travelRelations.tripId, id),
            eq(travelRelations.userId, userId),
          ),
        )
        .limit(1),
    );

    if (existingError) throw existingError;
    const existing = existingData?.[0];

    if (existing) {
      return NextResponse.json({ ok: true, message: t("alreadyParticipant") });
    }

    const { error: insertError } = await safeQuery(
      db.insert(travelRelations).values({
        id: crypto.randomUUID(),
        tripId: id,
        userId,
      }),
    );

    if (insertError) throw insertError;

    // Create notification for the new participant
    if (userId !== session.sub) {
      try {
        await sendNotification({
          userIds: [userId],
          type: "trip",
          entityId: id,
          title: "Neue Reise",
          body: "Du wurdest zu einer Reise hinzugefügt",
          link: `/reisen/${id}`,
          tag: `trip-${id}`,
        });
      } catch (notifyError) {
        console.error(
          "[API/Travel/Trips/Participants] Notification Error:",
          notifyError,
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[API/Travel/Trips/Participants] POST Error:", error);
    return NextResponse.json({ error: t("saveError") }, { status: 500 });
  }
}
