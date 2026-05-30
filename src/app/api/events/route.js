import crypto from "node:crypto";
import { and, eq, inArray, or } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth/session";
import { db, safeQuery } from "@/lib/db/db";
import { eventPermissions, events, notifications } from "@/lib/db/schema";

export async function GET() {
  const t = await getTranslations("Common");
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: t("unauthorized") }, { status: 401 });

  const userId = session.sub;

  const { data: viewPermRows, error: viewPermError } = await safeQuery(
    db
      .select({ eventId: eventPermissions.eventId })
      .from(eventPermissions)
      .where(
        and(
          eq(eventPermissions.userId, userId),
          eq(eventPermissions.canView, 1),
        ),
      ),
  );

  const permEventIds = viewPermRows?.map((r) => r.eventId) || [];

  const conditions = [eq(events.isPublic, 1), eq(events.creatorId, userId)];
  if (permEventIds.length > 0)
    conditions.push(inArray(events.id, permEventIds));

  const { data: rows, error: eventsError } = await safeQuery(
    db
      .select()
      .from(events)
      .where(or(...conditions))
      .orderBy(events.startAt),
  );

  const { data: editPermRows, error: editPermError } = await safeQuery(
    db
      .select({ eventId: eventPermissions.eventId })
      .from(eventPermissions)
      .where(
        and(
          eq(eventPermissions.userId, userId),
          eq(eventPermissions.canEdit, 1),
        ),
      ),
  );

  if (viewPermError || eventsError || editPermError) {
    return NextResponse.json({ error: t("dbError") }, { status: 500 });
  }

  const editEventIds = new Set(editPermRows?.map((r) => r.eventId) || []);

  const result = (rows || []).map((ev) => ({
    ...ev,
    canEdit:
      session.isAdmin || ev.creatorId === userId || editEventIds.has(ev.id),
  }));

  return NextResponse.json(result);
}

export async function POST(req) {
  const t = await getTranslations("Common");
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: t("unauthorized") }, { status: 401 });

  const {
    title,
    description,
    startAt,
    endAt,
    allDay,
    isPublic,
    permissions = [],
  } = await req.json();

  if (!title?.trim() || !startAt)
    return NextResponse.json({ error: t("missingFields") }, { status: 400 });

  const id = crypto.randomUUID();
  const now = new Date();

  const { error: insertError } = await safeQuery(
    db.insert(events).values({
      id,
      title: title.trim(),
      description: description?.trim() || null,
      startAt: new Date(startAt),
      endAt: endAt ? new Date(endAt) : null,
      allDay: allDay ? 1 : 0,
      isPublic: isPublic === false ? 0 : 1,
      createdAt: now,
      creatorId: session.sub,
    }),
  );

  if (insertError) {
    return NextResponse.json({ error: t("dbError") }, { status: 500 });
  }

  if (permissions.length > 0) {
    const { error: permError } = await safeQuery(
      db.insert(eventPermissions).values(
        permissions.map((p) => ({
          id: crypto.randomUUID(),
          eventId: id,
          userId: p.userId,
          canView: p.canView ? 1 : 0,
          canEdit: p.canEdit ? 1 : 0,
          createdAt: now,
        })),
      ),
    );
    if (permError) {
      return NextResponse.json({ error: t("dbError") }, { status: 500 });
    }

    // Create notifications for users with view permission
    try {
      const notificationValues = permissions
        .filter((p) => p.canView && p.userId !== session.sub)
        .map((p) => ({
          id: crypto.randomUUID(),
          userId: p.userId,
          type: "event",
          entityId: id,
          createdAt: now,
        }));

      if (notificationValues.length > 0) {
        await safeQuery(db.insert(notifications).values(notificationValues));
      }
    } catch (notifyError) {
      console.error("[API/Events] Notification Error:", notifyError);
    }
  }

  const { data: rows, error: selectError } = await safeQuery(
    db.select().from(events).where(eq(events.id, id)).limit(1),
  );
  if (selectError || !rows?.[0]) {
    return NextResponse.json({ error: t("dbError") }, { status: 500 });
  }
  return NextResponse.json({ ...rows[0], canEdit: true }, { status: 201 });
}
