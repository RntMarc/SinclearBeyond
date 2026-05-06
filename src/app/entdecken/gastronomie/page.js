import { getTranslations } from "next-intl/server";
import { ArrowLeft, Star, Utensils, Plus } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db/db";
import { discoverPlaces, discoverReviews } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { getProfileData } from "@/lib/profile/profile";
import { redirect } from "next/navigation";
import AppShell from "@/components/layout/Appshell";

export default async function GastronomyListPage() {
  const t = await getTranslations("Discover");

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
      <div className="flex flex-col h-full bg-background">
        <header className="px-6 py-6 border-b border-border bg-card shrink-0">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/entdecken"
                className="p-2 hover:bg-muted rounded-full transition-colors"
              >
                <ArrowLeft size={20} />
              </Link>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 text-primary">
                  <Utensils size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">
                    {t("subtitle")}
                  </span>
                </div>
                <h1 className="text-xl font-black">
                  {t("categories.gastronomy")}
                </h1>
              </div>
            </div>
            <Link
              href="/entdecken/neu?category=gastronomy"
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
            >
              <Plus size={16} />
              {t("addPlace")}
            </Link>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-10">
          <div className="max-w-5xl mx-auto">
            {places.length > 0
              ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {places.map((place) => (
                    <Link
                      key={place.id}
                      href={`/entdecken/orte/${place.id}`}
                      className="group bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/50 transition-all shadow-sm flex flex-col"
                    >
                      <div className="p-6 space-y-4">
                        <div>
                          <h3 className="font-bold text-lg group-hover:text-primary transition-colors">
                            {place.name}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {place.address}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 text-orange-500">
                            <Star
                              size={16}
                              fill={place.avgRating ? "currentColor" : "none"}
                            />
                            <span className="text-sm font-bold">
                              {place.avgRating
                                ? Number(place.avgRating).toFixed(1)
                                : "-"}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            ({place.reviewCount} {t("reviews")})
                          </span>
                        </div>

                        {place.openingHours && (
                          <div className="text-[10px] text-muted-foreground bg-muted/50 px-2 py-1 rounded-md inline-block max-w-full truncate">
                            {place.openingHours}
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              : <div className="p-20 border-2 border-dashed border-border rounded-3xl flex flex-col items-center justify-center text-center">
                  <Utensils size={48} className="text-muted-foreground/20 mb-4" />
                  <p className="text-muted-foreground mb-6">
                    Noch keine Restaurants oder Cafés eingetragen.
                  </p>
                  <Link
                    href="/entdecken/neu?category=gastronomy"
                    className="px-6 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold"
                  >
                    Den ersten Ort hinzufügen
                  </Link>
                </div>}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
