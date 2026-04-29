import { eq, inArray } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/db";
import { travelRelations, travelTrips } from "@/lib/db/schema";

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
