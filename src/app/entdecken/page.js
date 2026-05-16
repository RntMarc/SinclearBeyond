import { eq, sql } from "drizzle-orm";
import { Compass } from "lucide-react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import AppShell from "@/components/layout/Appshell";
import PageHeader from "@/components/layout/PageHeader";
import { getSessionWithSubs } from "@/lib/auth/sessionExtended";
import { db } from "@/lib/db/db";
import {
  discoverBookmarks,
  discoverPlaces,
  discoverReviews,
} from "@/lib/db/schema";
import { getProfileData } from "@/lib/profile/profile";
import DiscoverClient from "./DiscoverClient";

export default async function DiscoverPage() {
  const t = await getTranslations("Discover");
  const session = await getSessionWithSubs();

  if (!session) {
    redirect("/login?callbackUrl=/entdecken");
  }

  const data = await getProfileData(session);
  if (!data) redirect("/login");
  const { user } = data;

  const bookmarks = await db
    .select({
      id: discoverPlaces.id,
      name: discoverPlaces.name,
      category: discoverPlaces.category,
      address: discoverPlaces.address,
    })
    .from(discoverBookmarks)
    .innerJoin(discoverPlaces, eq(discoverBookmarks.placeId, discoverPlaces.id))
    .where(eq(discoverBookmarks.userId, session.sub));

  // Get 11 random places
  const randomPlaces = await db
    .select({
      id: discoverPlaces.id,
      name: discoverPlaces.name,
      address: discoverPlaces.address,
      category: discoverPlaces.category,
      avgRating: sql`AVG(${discoverReviews.rating})`,
      reviewCount: sql`COUNT(${discoverReviews.id})`,
    })
    .from(discoverPlaces)
    .leftJoin(discoverReviews, eq(discoverPlaces.id, discoverReviews.placeId))
    .groupBy(discoverPlaces.id)
    .orderBy(sql`RAND()`)
    .limit(11);

  const allPlaces = await db
    .select({
      id: discoverPlaces.id,
      name: discoverPlaces.name,
      address: discoverPlaces.address,
      latitude: discoverPlaces.latitude,
      longitude: discoverPlaces.longitude,
      category: discoverPlaces.category,
    })
    .from(discoverPlaces);

  return (
    <AppShell user={user} session={session}>
      <div className="flex flex-col h-full bg-background">
        <PageHeader
          subtitle={t("subtitle")}
          title={t("title")}
          icon={Compass}
        />

        <div className="flex-1 overflow-y-auto p-6 md:p-10">
          <DiscoverClient
            initialRandomPlaces={randomPlaces}
            bookmarks={bookmarks}
            allPlaces={allPlaces}
          />
        </div>
      </div>
    </AppShell>
  );
}
