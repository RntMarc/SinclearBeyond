import crypto from "node:crypto";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/db";
import { eventPermissions, events } from "@/lib/db/schema";

export async function PUT(req, { params }) {
  const t = await getTranslations("Common");
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: t("unauthorized") }, { status: 401 });

  const { id } = await params;
  const userId = session.sub;

  const [ev] = await db.select().from(events).where(eq(events.id, id)).limit(1);
  if (!ev) return NextResponse.json({ error: t("notFound") }, { status: 404 });

  const isCreator = ev.creatorId === userId;
  if (!isCreator) {
    const [perm] = await db
      .select()
      .from(eventPermissions)
      .where(
        and(
          eq(eventPermissions.eventId, id),
          eq(eventPermissions.userId, userId),
          eq(eventPermissions.canEdit, 1),
        ),
      )
      .limit(1);
    if (!perm)
      return NextResponse.json({ error: t("forbidden") }, { status: 403 });
  }

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

  await db
    .update(events)
    .set({
      title: title.trim(),
      description: description?.trim() || null,
      startAt: new Date(startAt),
      endAt: endAt ? new Date(endAt) : null,
      allDay: allDay ? 1 : 0,
      isPublic: isPublic === false ? 0 : 1,
    })
    .where(eq(events.id, id));

  await db.delete(eventPermissions).where(eq(eventPermissions.eventId, id));

  if (permissions.length > 0) {
    const now = new Date();
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

  const [updated] = await db
    .select()
    .from(events)
    .where(eq(events.id, id))
    .limit(1);
  return NextResponse.json({ ...updated, canEdit: true });
}

export async function DELETE(_req, { params }) {
  const t = await getTranslations("Common");
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: t("unauthorized") }, { status: 401 });

  const { id } = await params;
  const userId = session.sub;

  const [ev] = await db.select().from(events).where(eq(events.id, id)).limit(1);
  if (!ev) return NextResponse.json({ error: t("notFound") }, { status: 404 });

  const isCreator = ev.creatorId === userId;
  if (!isCreator && session.role !== "admin") {
    return NextResponse.json({ error: t("forbidden") }, { status: 403 });
  }

  await db.delete(eventPermissions).where(eq(eventPermissions.eventId, id));
  await db.delete(events).where(eq(events.id, id));

  return NextResponse.json({ ok: true });
}
