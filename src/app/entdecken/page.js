import { getTranslations } from "next-intl/server";
import { Compass, Utensils, TreePine, Bookmark } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db/db";
import { discoverBookmarks, discoverPlaces } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { getProfileData } from "@/lib/profile/profile";
import { redirect } from "next/navigation";
import AppShell from "@/components/layout/Appshell";

export default async function DiscoverPage() {
  const t = await getTranslations("Discover");
  const session = await getSession();

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

  return (
    <AppShell user={user} session={session}>
      <div className="flex flex-col h-full bg-background">
        {/* Header */}
        <header className="px-6 py-8 md:px-10 md:py-12 bg-card border-b border-border shrink-0">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-primary">
                <Compass size={16} />
                <span className="text-xs font-bold uppercase tracking-widest">
                  {t("subtitle")}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight">
                {t("title")}
              </h1>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-10">
          <div className="max-w-5xl mx-auto space-y-12">
            {/* Categories */}
            <section>
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                {t("categoriesLabel")}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link
                  href="/entdecken/gastronomie"
                  className="group p-6 bg-card border border-border rounded-2xl hover:border-primary/50 transition-all shadow-sm flex items-center gap-4"
                >
                  <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Utensils size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold">{t("categories.gastronomy")}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t("gastronomyDesc")}
                    </p>
                  </div>
                </Link>

                <div className="p-6 bg-muted/50 border border-border/50 rounded-2xl flex items-center gap-4 grayscale opacity-60 cursor-not-allowed">
                  <div className="w-12 h-12 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center shrink-0">
                    <TreePine size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold">{t("categories.leisure")}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t("leisureDesc")}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Bookmarks */}
            <section>
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                <Bookmark size={20} className="text-primary" />
                {t("bookmarks")}
              </h2>
              {bookmarks.length > 0
                ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {bookmarks.map((place) => (
                      <Link
                        key={place.id}
                        href={`/entdecken/orte/${place.id}`}
                        className="p-4 bg-card border border-border rounded-xl hover:border-primary/50 transition-all shadow-sm"
                      >
                        <h3 className="font-bold text-sm truncate">
                          {place.name}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {place.address}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                            {t(`categories.${place.category}`)}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                : <div className="p-12 border-2 border-dashed border-border rounded-3xl flex flex-col items-center justify-center text-center">
                    <Bookmark
                      size={32}
                      className="text-muted-foreground/30 mb-4"
                    />
                    <p className="text-sm text-muted-foreground max-w-xs">
                      {t("noBookmarks")}
                    </p>
                  </div>}
            </section>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
