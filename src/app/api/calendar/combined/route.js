import { and, eq, inArray, or } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth/session";
import { db, safeQuery } from "@/lib/db/db";
import {
  eventPermissions,
  eventRelations,
  events,
  travelEvents,
  travelRelations,
  travelTrips,
  users,
} from "@/lib/db/schema";
import { getWhoMarkedMe, getWhoIMarked } from "@/lib/profile/closeFriends";

export async function GET() {
  const t = await getTranslations("Common");
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: t("unauthorized") }, { status: 401 });

  const userId = session.sub;

  // 1. Standard Events
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

  const editEventIds = new Set(editPermRows?.map((r) => r.eventId) || []);

  const standardEvents =
    rows?.map((ev) => ({
      ...ev,
      canEdit:
        session.isAdmin || ev.creatorId === userId || editEventIds.has(ev.id),
    })) || [];

  // 2. Trips
  const { data: userRelations, error: travelRelError } = await safeQuery(
    db
      .select({ tripId: travelRelations.tripId })
      .from(travelRelations)
      .where(eq(travelRelations.userId, userId)),
  );

  const participantTripIds = userRelations?.map((r) => r.tripId) || [];

  const { data: userEventRelations, error: eventRelError } = await safeQuery(
    db
      .select({ eventId: eventRelations.eventId })
      .from(eventRelations)
      .where(eq(eventRelations.userId, userId)),
  );
  const participantEventIds = userEventRelations?.map((r) => r.eventId) || [];

  let trips = [];
  let tripsError = false;
  if (session.isAdmin) {
    const { data: adminTrips, error: adminTripsError } = await safeQuery(
      db.select().from(travelTrips).orderBy(travelTrips.start),
    );
    trips = adminTrips || [];
    tripsError = adminTripsError;
  } else if (participantTripIds.length > 0) {
    const { data: userTrips, error: userTripsError } = await safeQuery(
      db
        .select()
        .from(travelTrips)
        .where(inArray(travelTrips.id, participantTripIds))
        .orderBy(travelTrips.start),
    );
    trips = userTrips || [];
    tripsError = userTripsError;
  }

  // 3. Travel Events
  let trvEvents = [];
  let trvEventsError = false;
  if (participantEventIds.length > 0) {
    const { data: travelEventsData, error: travelEventsErr } = await safeQuery(
      db
        .select()
        .from(travelEvents)
        .where(inArray(travelEvents.id, participantEventIds))
        .orderBy(travelEvents.start),
    );
    trvEvents = travelEventsData || [];
    trvEventsError = travelEventsErr;
  }

  // 4. Birthdays
  const { data: allUsersWithBirthday, error: usersError } = await safeQuery(
    db
      .select({
        id: users.id,
        displayName: users.displayName,
        birthday: users.birthday,
        birthdayVisibility: users.birthdayVisibility,
      })
      .from(users)
      .where(and(eq(users.id, users.id))),
  ); // Dummy to ensure select

  const whoMarkedMeRecords = await getWhoMarkedMe();
  const visibilityCloseFriendIds = new Set(
    whoMarkedMeRecords.map((r) => r.userId),
  );

  // 5. CloseFriends abrufen, die ICH markiert habe (für Herzchen-Symbol)
  const whoIMarkedRecords = await getWhoIMarked();
  const myCloseFriendIds = new Set(
    whoIMarkedRecords.map((r) => r.friendId),
  );

  if (
    viewPermError ||
    eventsError ||
    editPermError ||
    travelRelError ||
    eventRelError ||
    tripsError ||
    trvEventsError ||
    usersError
  ) {
    return NextResponse.json({ error: t("dbError") }, { status: 500 });
  }

  const birthdays = (allUsersWithBirthday || [])
    .filter((u) => {
      if (!u.birthday) return false;
      if (u.id === userId) return true;
      const visibility = u.birthdayVisibility;
      const allowsMePrivateInfo = visibilityCloseFriendIds.has(u.id);
      return visibility === 1 || (visibility === 2 && allowsMePrivateInfo);
    })
    .map((u) => ({
      id: u.id,
      displayName: u.displayName,
      birthday: u.birthday,
      isCloseFriend: myCloseFriendIds.has(u.id),
    }));

  return NextResponse.json({
    events: standardEvents.map((ev) => ({ ...ev, type: "event" })),
    trips: trips.map((t) => ({ ...t, type: "trip" })),
    travelEvents: trvEvents.map((te) => ({ ...te, type: "travelEvent" })),
    birthdays: birthdays.map((b) => ({ ...b, type: "birthday" })),
  });
}
