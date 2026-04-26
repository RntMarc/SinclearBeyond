import crypto from "node:crypto";
import { and, eq, inArray, or } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/db";
import { eventPermissions, events } from "@/lib/db/schema";

export async function GET() {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const userId = session.sub;

  const viewPermRows = await db
    .select({ eventId: eventPermissions.eventId })
    .from(eventPermissions)
    .where(
      and(eq(eventPermissions.userId, userId), eq(eventPermissions.canView, 1)),
    );

  const permEventIds = viewPermRows.map((r) => r.eventId);

  const conditions = [eq(events.isPublic, 1), eq(events.creatorId, userId)];
  if (permEventIds.length > 0)
    conditions.push(inArray(events.id, permEventIds));

  const rows = await db
    .select()
    .from(events)
    .where(or(...conditions))
    .orderBy(events.startAt);

  const editPermRows = await db
    .select({ eventId: eventPermissions.eventId })
    .from(eventPermissions)
    .where(
      and(eq(eventPermissions.userId, userId), eq(eventPermissions.canEdit, 1)),
    );

  const editEventIds = new Set(editPermRows.map((r) => r.eventId));

  const result = rows.map((ev) => ({
    ...ev,
    canEdit: ev.creatorId === userId || editEventIds.has(ev.id),
  }));

  return NextResponse.json(result);
}

export async function POST(req) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

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
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });

  const id = crypto.randomUUID();
  const now = new Date();

  await db.insert(events).values({
    id,
    title: title.trim(),
    description: description?.trim() || null,
    startAt: new Date(startAt),
    endAt: endAt ? new Date(endAt) : null,
    allDay: allDay ? 1 : 0,
    isPublic: isPublic === false ? 0 : 1,
    createdAt: now,
    creatorId: session.sub,
  });

  if (permissions.length > 0) {
    await db.insert(eventPermissions).values(
      permissions.map((p) => ({
        id: crypto.randomUUID(),
        eventId: id,
        userId: p.userId,
        canView: p.canView ? 1 : 0,
        canEdit: p.canEdit ? 1 : 0,
        createdAt: now,
      })),
    );
  }

  const [row] = await db
    .select()
    .from(events)
    .where(eq(events.id, id))
    .limit(1);
  return NextResponse.json({ ...row, canEdit: true }, { status: 201 });
}
