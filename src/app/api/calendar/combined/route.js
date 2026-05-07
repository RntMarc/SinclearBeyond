import { and, eq, inArray, or } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/db";
import {
  closeFriends,
  eventPermissions,
  events,
  travelEvents,
  travelRelations,
  travelTrips,
  users,
} from "@/lib/db/schema";

export async function GET() {
  const t = await getTranslations("Common");
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: t("unauthorized") }, { status: 401 });

  const userId = session.sub;

  // 1. Standard Events
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

  const standardEvents = await db
    .select()
    .from(events)
    .where(or(...conditions))
    .orderBy(events.startAt);

  // 2. Trips
  const userRelations = await db
    .select({ tripId: travelRelations.tripId })
    .from(travelRelations)
    .where(eq(travelRelations.userId, userId));

  const participantTripIds = userRelations.map((r) => r.tripId);

  let trips = [];
  if (session.isAdmin) {
    trips = await db.select().from(travelTrips).orderBy(travelTrips.start);
  } else if (participantTripIds.length > 0) {
    trips = await db
      .select()
      .from(travelTrips)
      .where(inArray(travelTrips.id, participantTripIds))
      .orderBy(travelTrips.start);
  }

  // 3. Travel Events
  const visibleTripIds = trips.map((t) => t.id);
  let trvEvents = [];
  if (visibleTripIds.length > 0) {
    trvEvents = await db
      .select()
      .from(travelEvents)
      .where(inArray(travelEvents.tripId, visibleTripIds))
      .orderBy(travelEvents.start);
  }

  // 4. Birthdays
  const allUsersWithBirthday = await db
    .select({
      id: users.id,
      displayName: users.displayName,
      birthday: users.birthday,
      birthdayVisibility: users.birthdayVisibility,
    })
    .from(users)
    .where(and(eq(users.id, users.id))); // Dummy to ensure select

  const whoMarkedMeAsCloseFriend = await db
    .select({ userId: closeFriends.userId })
    .from(closeFriends)
    .where(eq(closeFriends.friendId, userId));

  const closeFriendIds = new Set(whoMarkedMeAsCloseFriend.map((f) => f.userId));

  const birthdays = allUsersWithBirthday
    .filter((u) => {
      if (!u.birthday) return false;
      if (u.id === userId) return true;
      const visibility = u.birthdayVisibility;
      const isCloseFriend = closeFriendIds.has(u.id);
      return visibility === 1 || (visibility === 2 && isCloseFriend);
    })
    .map((u) => ({
      id: u.id,
      displayName: u.displayName,
      birthday: u.birthday,
    }));

  return NextResponse.json({
    events: standardEvents.map((ev) => ({ ...ev, type: "event" })),
    trips: trips.map((t) => ({ ...t, type: "trip" })),
    travelEvents: trvEvents.map((te) => ({ ...te, type: "travelEvent" })),
    birthdays: birthdays.map((b) => ({ ...b, type: "birthday" })),
  });
}
