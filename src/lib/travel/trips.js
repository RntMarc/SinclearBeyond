import { and, eq, inArray, isNull } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/db";
import {
  closeFriends,
  contactInfo,
  eventRelations,
  socialInfo,
  travelAccommodations,
  travelEvents,
  travelRelations,
  travelTrips,
  users,
} from "@/lib/db/schema";
import {
  CONTACT_FIELDS,
  SOCIAL_FIELDS,
  filterEmail,
  filterVisibility,
} from "@/lib/profile/visibility";

export async function getTrips(standalone = false) {
  const session = await getSession();
  if (!session?.sub) return null;

  if (standalone) {
    let events;
    if (session.isAdmin) {
      events = await db
        .select()
        .from(travelEvents)
        .where(isNull(travelEvents.tripId))
        .orderBy(travelEvents.start);
    } else {
      events = await db
        .select({ event: travelEvents })
        .from(travelEvents)
        .innerJoin(eventRelations, eq(travelEvents.id, eventRelations.eventId))
        .where(
          and(
            isNull(travelEvents.tripId),
            eq(eventRelations.userId, session.sub),
          ),
        )
        .orderBy(travelEvents.start)
        .then((rows) => rows.map((r) => r.event));
    }

    const now = new Date();
    return events.map((event) => ({
      ...event,
      isPast: new Date(event.end) < now,
      isActive: new Date(event.start) <= now && new Date(event.end) >= now,
      isUpcoming: new Date(event.start) > now,
    }));
  }

  const userRelations = await db
    .select({ tripId: travelRelations.tripId })
    .from(travelRelations)
    .where(eq(travelRelations.userId, session.sub));

  const participantTripIds = new Set(userRelations.map((r) => r.tripId));

  let trips;
  if (session.isAdmin) {
    trips = await db.select().from(travelTrips).orderBy(travelTrips.start);
  } else {
    if (participantTripIds.size === 0) return [];
    trips = await db
      .select()
      .from(travelTrips)
      .where(inArray(travelTrips.id, Array.from(participantTripIds)))
      .orderBy(travelTrips.start);
  }

  const now = new Date();

  return trips.map((trip) => ({
    ...trip,
    isPast: new Date(trip.end) < now,
    isActive: new Date(trip.start) <= now && new Date(trip.end) >= now,
    isUpcoming: new Date(trip.start) > now,
    isParticipant: participantTripIds.has(trip.id),
  }));
}

export async function getTripById(id) {
  const session = await getSession();
  if (!session?.sub) return null;

  if (!id) return null;

  const [trip] = await db
    .select()
    .from(travelTrips)
    .where(eq(travelTrips.id, id))
    .limit(1);

  if (!trip) return null;

  const userRelation = await db
    .select()
    .from(travelRelations)
    .where(
      and(
        eq(travelRelations.tripId, id),
        eq(travelRelations.userId, session.sub),
      ),
    )
    .limit(1);

  const isParticipant = userRelation.length > 0;
  if (!session.isAdmin && !isParticipant) return { error: "Unauthorized" };

  const relations = await db
    .select({
      user: {
        id: users.id,
        displayName: users.displayName,
        email: users.email,
        emailVisibility: users.emailVisibility,
        image: users.image,
      },
      accommodation: travelAccommodations,
      contact: contactInfo,
      social: socialInfo,
    })
    .from(travelRelations)
    .innerJoin(users, eq(travelRelations.userId, users.id))
    .leftJoin(
      travelAccommodations,
      eq(travelRelations.accommodationId, travelAccommodations.id),
    )
    .leftJoin(contactInfo, eq(users.id, contactInfo.userId))
    .leftJoin(socialInfo, eq(users.id, socialInfo.userId))
    .where(eq(travelRelations.tripId, id));

  // Visibility logic
  const whoMarkedMeAsCloseFriend = await db
    .select({ userId: closeFriends.userId })
    .from(closeFriends)
    .where(eq(closeFriends.friendId, session.sub));

  const visibilityCloseFriendIds = new Set(
    whoMarkedMeAsCloseFriend.map((f) => f.userId),
  );

  const iMarkedAsCloseFriend = await db
    .select({ friendId: closeFriends.friendId })
    .from(closeFriends)
    .where(eq(closeFriends.userId, session.sub));

  const myCloseFriendIds = new Set(iMarkedAsCloseFriend.map((f) => f.friendId));

  const events = await db
    .select()
    .from(travelEvents)
    .where(eq(travelEvents.tripId, id))
    .orderBy(travelEvents.start);

  const eventIds = events.map((e) => e.id);
  const relations_events =
    eventIds.length > 0
      ? await db
          .select()
          .from(eventRelations)
          .where(inArray(eventRelations.eventId, eventIds))
      : [];

  const now = new Date();

  return {
    ...trip,
    isPast: new Date(trip.end) < now,
    isActive: new Date(trip.start) <= now && new Date(trip.end) >= now,
    isUpcoming: new Date(trip.start) > now,
    participants: relations.map((r) => {
      const allowsMePrivateInfo =
        r.user.id === session.sub || visibilityCloseFriendIds.has(r.user.id);
      return {
        ...r.user,
        email: filterEmail(r.user, allowsMePrivateInfo),
        isCloseFriend: myCloseFriendIds.has(r.user.id),
        contactInfo: filterVisibility(
          r.contact,
          CONTACT_FIELDS,
          allowsMePrivateInfo,
        ),
        socialInfo: filterVisibility(
          r.social,
          SOCIAL_FIELDS,
          allowsMePrivateInfo,
        ),
        accommodation: r.accommodation,
      };
    }),
    userAccommodation:
      relations.find((r) => r.user.id === session.sub)?.accommodation || null,
    events: events.map((event) => {
      const participantIds = relations_events
        .filter((r) => r.eventId === event.id)
        .map((r) => r.userId);
      return {
        ...event,
        isPast: new Date(event.end) < now,
        isActive: new Date(event.start) <= now && new Date(event.end) >= now,
        isUpcoming: new Date(event.start) > now,
        participantIds,
        isParticipant: participantIds.includes(session.sub),
      };
    }),
  };
}
