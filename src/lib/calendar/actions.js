"use server";

import { and, eq, inArray, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { db, safeQuery } from "@/lib/db/db";
import { eventPermissions, events, readStatuses } from "@/lib/db/schema";

export async function getUnreadCalendarCount() {
  const session = await getSession();
  if (!session) return 0;
  const userId = session.sub;

  // 1. Get all events user can see
  const { data: viewPermRows } = await safeQuery(
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

  const { data: rows } = await safeQuery(
    db
      .select({ id: events.id })
      .from(events)
      .where(or(...conditions)),
  );

  const eventIds = (rows || []).map((r) => r.id);
  if (eventIds.length === 0) return 0;

  // 2. Check read statuses
  const { data: readEntries } = await safeQuery(
    db
      .select({ entityId: readStatuses.entityId })
      .from(readStatuses)
      .where(
        and(
          eq(readStatuses.userId, userId),
          eq(readStatuses.entityType, "event"),
          inArray(readStatuses.entityId, eventIds),
        ),
      ),
  );

  const readIds = new Set((readEntries || []).map((r) => r.entityId));
  const unreadCount = eventIds.filter((id) => !readIds.has(id)).length;

  return unreadCount;
}

export async function markAllCalendarAsRead() {
  const session = await getSession();
  if (!session) return { ok: false };
  const userId = session.sub;

  const { data: viewPermRows } = await safeQuery(
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

  const { data: rows } = await safeQuery(
    db
      .select({ id: events.id })
      .from(events)
      .where(or(...conditions)),
  );

  const eventIds = (rows || []).map((r) => r.id);
  if (eventIds.length === 0) return { ok: true };

  const { data: alreadyRead } = await safeQuery(
    db
      .select({ entityId: readStatuses.entityId })
      .from(readStatuses)
      .where(
        and(
          eq(readStatuses.userId, userId),
          eq(readStatuses.entityType, "event"),
          inArray(readStatuses.entityId, eventIds),
        ),
      ),
  );

  const alreadyReadIds = new Set((alreadyRead || []).map((r) => r.entityId));
  const unreadIds = eventIds.filter((id) => !alreadyReadIds.has(id));

  if (unreadIds.length > 0) {
    const values = unreadIds.map((id) => ({
      id: crypto.randomUUID(),
      userId,
      entityType: "event",
      entityId: id,
      createdAt: new Date(),
    }));
    await safeQuery(db.insert(readStatuses).values(values));
  }

  revalidatePath("/kalender");
  revalidatePath("/", "layout");
  return { ok: true };
}
