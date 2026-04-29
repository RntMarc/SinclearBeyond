import { and, eq, inArray } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/db";
import {
  travelAccommodations,
  travelEvents,
  travelRelations,
  travelTrips,
  users,
} from "@/lib/db/schema";

export async function getTrips() {
  const session = await getSession();
  if (!session?.sub) return null;

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
      },
      accommodation: travelAccommodations,
    })
    .from(travelRelations)
    .innerJoin(users, eq(travelRelations.userId, users.id))
    .leftJoin(
      travelAccommodations,
      eq(travelRelations.accommodationId, travelAccommodations.id),
    )
    .where(eq(travelRelations.tripId, id));

  const events = await db
    .select()
    .from(travelEvents)
    .where(eq(travelEvents.tripId, id))
    .orderBy(travelEvents.start);

  const now = new Date();

  return {
    ...trip,
    isPast: new Date(trip.end) < now,
    isActive: new Date(trip.start) <= now && new Date(trip.end) >= now,
    isUpcoming: new Date(trip.start) > now,
    participants: relations.map((r) => ({
      ...r.user,
      accommodation: r.accommodation,
    })),
    userAccommodation:
      relations.find((r) => r.user.id === session.sub)?.accommodation || null,
    events: events.map((event) => ({
      ...event,
      isPast: new Date(event.end) < now,
      isActive: new Date(event.start) <= now && new Date(event.end) >= now,
      isUpcoming: new Date(event.start) > now,
    })),
  };
}
