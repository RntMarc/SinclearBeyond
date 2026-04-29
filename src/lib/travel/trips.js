import { eq, inArray } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/db";
import { travelRelations, travelTrips } from "@/lib/db/schema";

export async function getTrips() {
  const session = await getSession();
  if (!session?.sub) return null;

  const relations = await db
    .select({ tripId: travelRelations.tripId })
    .from(travelRelations)
    .where(eq(travelRelations.userId, session.sub));

  if (relations.length === 0) return [];

  const tripIds = relations.map((r) => r.tripId);

  const trips = await db
    .select()
    .from(travelTrips)
    .where(inArray(travelTrips.id, tripIds))
    .orderBy(travelTrips.start);

  const now = new Date();

  return trips.map((trip) => ({
    ...trip,
    isPast: new Date(trip.end) < now,
    isActive:
      new Date(trip.start) <= now && new Date(trip.end) >= now,
    isUpcoming: new Date(trip.start) > now,
  }));
}
