import { and, eq, inArray, isNull } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { db, safeQuery } from "@/lib/db/db";
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
  filterEmail,
  filterVisibility,
  SOCIAL_FIELDS,
} from "@/lib/profile/visibility";

export async function getTrips(standalone = false) {
  const session = await getSession();
  if (!session?.sub) return null;

  if (standalone) {
    let events = [];
    if (session.isAdmin) {
      const { data, error } = await safeQuery(
        db
          .select()
          .from(travelEvents)
          .where(isNull(travelEvents.tripId))
          .orderBy(travelEvents.start),
      );
      if (error) throw error;
      events = data || [];
    } else {
      const { data, error } = await safeQuery(
        db
          .select({ event: travelEvents })
          .from(travelEvents)
          .innerJoin(
            eventRelations,
            eq(travelEvents.id, eventRelations.eventId),
          )
          .where(
            and(
              isNull(travelEvents.tripId),
              eq(eventRelations.userId, session.sub),
            ),
          )
          .orderBy(travelEvents.start),
      );
      if (error) throw error;
      events = (data || []).map((r) => r.event);
    }

    const now = new Date();
    return events.map((event) => ({
      ...event,
      isPast: new Date(event.end) < now,
      isActive: new Date(event.start) <= now && new Date(event.end) >= now,
      isUpcoming: new Date(event.start) > now,
    }));
  }

  const { data: userRelations, error: relErr } = await safeQuery(
    db
      .select({ tripId: travelRelations.tripId })
      .from(travelRelations)
      .where(eq(travelRelations.userId, session.sub)),
  );
  if (relErr) throw relErr;

  const participantTripIds = new Set(
    (userRelations || []).map((r) => r.tripId),
  );

  let trips = [];
  if (session.isAdmin) {
    const { data, error } = await safeQuery(
      db.select().from(travelTrips).orderBy(travelTrips.start),
    );
    if (error) throw error;
    trips = data || [];
  } else {
    if (participantTripIds.size === 0) return [];
    const { data, error } = await safeQuery(
      db
        .select()
        .from(travelTrips)
        .where(inArray(travelTrips.id, Array.from(participantTripIds)))
        .orderBy(travelTrips.start),
    );
    if (error) throw error;
    trips = data || [];
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

  const { data: tripRows, error: tripErr } = await safeQuery(
    db.select().from(travelTrips).where(eq(travelTrips.id, id)).limit(1),
  );
  if (tripErr) throw tripErr;

  const trip = tripRows?.[0];
  if (!trip) return null;

  const { data: userRelRows, error: userRelErr } = await safeQuery(
    db
      .select()
      .from(travelRelations)
      .where(
        and(
          eq(travelRelations.tripId, id),
          eq(travelRelations.userId, session.sub),
        ),
      )
      .limit(1),
  );
  if (userRelErr) throw userRelErr;

  const isParticipant = (userRelRows || []).length > 0;
  if (!session.isAdmin && !isParticipant) return { error: "Unauthorized" };

  const { data: relations, error: relErr } = await safeQuery(
    db
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
      .where(eq(travelRelations.tripId, id)),
  );
  if (relErr) throw relErr;

  // Visibility logic
  const { data: whoMarkedMe, error: whoMarkedMeErr } = await safeQuery(
    db
      .select({ userId: closeFriends.userId })
      .from(closeFriends)
      .where(eq(closeFriends.friendId, session.sub)),
  );
  if (whoMarkedMeErr) throw whoMarkedMeErr;

  const visibilityCloseFriendIds = new Set(
    (whoMarkedMe || []).map((f) => f.userId),
  );

  const { data: iMarked, error: iMarkedErr } = await safeQuery(
    db
      .select({ friendId: closeFriends.friendId })
      .from(closeFriends)
      .where(eq(closeFriends.userId, session.sub)),
  );
  if (iMarkedErr) throw iMarkedErr;

  const myCloseFriendIds = new Set((iMarked || []).map((f) => f.friendId));

  const { data: events, error: eventErr } = await safeQuery(
    db
      .select()
      .from(travelEvents)
      .where(eq(travelEvents.tripId, id))
      .orderBy(travelEvents.start),
  );
  if (eventErr) throw eventErr;

  const eventIds = (events || []).map((e) => e.id);
  let relations_events = [];
  if (eventIds.length > 0) {
    const { data, error } = await safeQuery(
      db
        .select()
        .from(eventRelations)
        .where(inArray(eventRelations.eventId, eventIds)),
    );
    if (error) throw error;
    relations_events = data || [];
  }

  const now = new Date();

  return {
    ...trip,
    isPast: new Date(trip.end) < now,
    isActive: new Date(trip.start) <= now && new Date(trip.end) >= now,
    isUpcoming: new Date(trip.start) > now,
    participants: (relations || []).map((r) => {
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
      (relations || []).find((r) => r.user.id === session.sub)?.accommodation ||
      null,
    events: (events || []).map((event) => {
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
