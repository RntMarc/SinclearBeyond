import { eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import AppShell from "@/components/layout/Appshell";
import { getSessionWithSubs } from "@/lib/auth/sessionExtended";
import { db, safeQuery } from "@/lib/db/db";
import { discoverPlaces, discoverReviews } from "@/lib/db/schema";
import { getProfileData } from "@/lib/profile/profile";
import ClientLeisureList from "./ClientLeisureList";

export default async function LeisureListPage() {
  const session = await getSessionWithSubs();
  if (!session) redirect("/login?callbackUrl=/entdecken/freizeit");

  const data = await getProfileData(session);
  if (!data) redirect("/login");
  const { user } = data;

  const { data: places } = await safeQuery(
    db
      .select({
        id: discoverPlaces.id,
        name: discoverPlaces.name,
        address: discoverPlaces.address,
        avgRating: sql`AVG(${discoverReviews.rating})`,
        reviewCount: sql`COUNT(${discoverReviews.id})`,
        openingHours: discoverPlaces.openingHours,
        latitude: discoverPlaces.latitude,
        longitude: discoverPlaces.longitude,
      })
      .from(discoverPlaces)
      .leftJoin(discoverReviews, eq(discoverPlaces.id, discoverReviews.placeId))
      .where(eq(discoverPlaces.category, "leisure"))
      .groupBy(discoverPlaces.id)
      .orderBy(sql`${discoverPlaces.name} ASC`),
  );

  return (
    <AppShell user={user} session={session}>
      <ClientLeisureList initialPlaces={places || []} />
    </AppShell>
  );
}
