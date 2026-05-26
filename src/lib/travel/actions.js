"use server";

import { and, eq, inArray, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { db, safeQuery } from "@/lib/db/db";
import {
  eventRelations,
  readStatuses,
  travelEvents,
  travelRelations,
  travelTrips,
} from "@/lib/db/schema";

export async function getUnreadTravelCount() {
  const session = await getSession();
  if (!session) return 0;

  // 1. Get all trips user is participant of (or all if admin)
  let tripIds = [];
  if (session.isAdmin) {
    const { data } = await safeQuery(
      db.select({ id: travelTrips.id }).from(travelTrips),
    );
    tripIds = (data || []).map((t) => t.id);
  } else {
    const { data } = await safeQuery(
      db
        .select({ tripId: travelRelations.tripId })
        .from(travelRelations)
        .where(eq(travelRelations.userId, session.sub)),
    );
    tripIds = (data || []).map((r) => r.tripId);
  }

  // 2. Get all standalone events user is participant of (or all if admin)
  let eventIds = [];
  if (session.isAdmin) {
    const { data } = await safeQuery(
      db
        .select({ id: travelEvents.id })
        .from(travelEvents)
        .where(isNull(travelEvents.tripId)),
    );
    eventIds = (data || []).map((e) => e.id);
  } else {
    const { data } = await safeQuery(
      db
        .select({ id: travelEvents.id })
        .from(travelEvents)
        .innerJoin(eventRelations, eq(travelEvents.id, eventRelations.eventId))
        .where(
          and(
            isNull(travelEvents.tripId),
            eq(eventRelations.userId, session.sub),
          ),
        ),
    );
    eventIds = (data || []).map((e) => e.id);
  }

  if (tripIds.length === 0 && eventIds.length === 0) return 0;

  // 3. Check read statuses
  const { data: readEntries } = await safeQuery(
    db
      .select({
        entityId: readStatuses.entityId,
        entityType: readStatuses.entityType,
      })
      .from(readStatuses)
      .where(
        and(
          eq(readStatuses.userId, session.sub),
          inArray(readStatuses.entityType, ["travelTrip", "travelEvent"]),
        ),
      ),
  );

  const readTripIds = new Set(
    (readEntries || [])
      .filter((r) => r.entityType === "travelTrip")
      .map((r) => r.entityId),
  );
  const readEventIds = new Set(
    (readEntries || [])
      .filter((r) => r.entityType === "travelEvent")
      .map((r) => r.entityId),
  );

  const unreadTrips = tripIds.filter((id) => !readTripIds.has(id)).length;
  const unreadEvents = eventIds.filter((id) => !readEventIds.has(id)).length;

  return unreadTrips + unreadEvents;
}

export async function markAllTravelAsRead() {
  const session = await getSession();
  if (!session) return { ok: false };

  // Logic to mark all relevant trips and events as read
  // For simplicity, we get all trip/event IDs the user can see and mark them.

  // Reuse some logic or just get IDs
  let tripIds = [];
  let eventIds = [];

  if (session.isAdmin) {
    const { data: tData } = await safeQuery(
      db.select({ id: travelTrips.id }).from(travelTrips),
    );
    tripIds = (tData || []).map((t) => t.id);
    const { data: eData } = await safeQuery(
      db
        .select({ id: travelEvents.id })
        .from(travelEvents)
        .where(isNull(travelEvents.tripId)),
    );
    eventIds = (eData || []).map((e) => e.id);
  } else {
    const { data: tData } = await safeQuery(
      db
        .select({ tripId: travelRelations.tripId })
        .from(travelRelations)
        .where(eq(travelRelations.userId, session.sub)),
    );
    tripIds = (tData || []).map((r) => r.tripId);
    const { data: eData } = await safeQuery(
      db
        .select({ id: travelEvents.id })
        .from(travelEvents)
        .innerJoin(eventRelations, eq(travelEvents.id, eventRelations.eventId))
        .where(
          and(
            isNull(travelEvents.tripId),
            eq(eventRelations.userId, session.sub),
          ),
        ),
    );
    eventIds = (eData || []).map((e) => e.id);
  }

  const { data: alreadyRead } = await safeQuery(
    db
      .select({
        entityId: readStatuses.entityId,
        entityType: readStatuses.entityType,
      })
      .from(readStatuses)
      .where(
        and(
          eq(readStatuses.userId, session.sub),
          inArray(readStatuses.entityType, ["travelTrip", "travelEvent"]),
        ),
      ),
  );

  const alreadyReadTripIds = new Set(
    (alreadyRead || [])
      .filter((r) => r.entityType === "travelTrip")
      .map((r) => r.entityId),
  );
  const alreadyReadEventIds = new Set(
    (alreadyRead || [])
      .filter((r) => r.entityType === "travelEvent")
      .map((r) => r.entityId),
  );

  const unreadTripIds = tripIds.filter((id) => !alreadyReadTripIds.has(id));
  const unreadEventIds = eventIds.filter((id) => !alreadyReadEventIds.has(id));

  const newReadStatuses = [
    ...unreadTripIds.map((id) => ({
      id: crypto.randomUUID(),
      userId: session.sub,
      entityType: "travelTrip",
      entityId: id,
      createdAt: new Date(),
    })),
    ...unreadEventIds.map((id) => ({
      id: crypto.randomUUID(),
      userId: session.sub,
      entityType: "travelEvent",
      entityId: id,
      createdAt: new Date(),
    })),
  ];

  if (newReadStatuses.length > 0) {
    await safeQuery(db.insert(readStatuses).values(newReadStatuses));
  }

  revalidatePath("/reisen");
  revalidatePath("/", "layout");
  return { ok: true };
}
