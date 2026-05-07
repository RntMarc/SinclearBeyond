import { getTranslations } from "next-intl/server";
import { ArrowLeft, Star, Utensils, Plus } from "lucide-react";
import Link from "next/link";
import ClientGastronomyList from "./ClientGastronomyList";
import { db } from "@/lib/db/db";
import { discoverPlaces, discoverReviews } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { getProfileData } from "@/lib/profile/profile";
import { redirect } from "next/navigation";
import AppShell from "@/components/layout/Appshell";

export default async function GastronomyListPage() {
  const session = await getSession();
  if (!session) redirect("/login?callbackUrl=/entdecken/gastronomie");

  const data = await getProfileData(session);
  if (!data) redirect("/login");
  const { user } = data;

  const places = await db
    .select({
      id: discoverPlaces.id,
      name: discoverPlaces.name,
      address: discoverPlaces.address,
      avgRating: sql`AVG(${discoverReviews.rating})`,
      reviewCount: sql`COUNT(${discoverReviews.id})`,
      openingHours: discoverPlaces.openingHours,
    })
    .from(discoverPlaces)
    .leftJoin(discoverReviews, eq(discoverPlaces.id, discoverReviews.placeId))
    .where(eq(discoverPlaces.category, "gastronomy"))
    .groupBy(discoverPlaces.id)
    .orderBy(sql`${discoverPlaces.name} ASC`);

  return (
    <AppShell user={user} session={session}>
      <ClientGastronomyList initialPlaces={places} />
    </AppShell>
  );
}
