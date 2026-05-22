import { eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import AppShell from "@/components/layout/Appshell";
import { InlineError } from "@/components/ui/InlineError";
import { getSessionWithSubs } from "@/lib/auth/sessionExtended";
import { db, safeQuery } from "@/lib/db/db";
import { mediaItems, mediaReviews } from "@/lib/db/schema";
import { getProfileData } from "@/lib/profile/profile";
import GamesClient from "./GamesClient";

export default async function GamesPage() {
  const session = await getSessionWithSubs();

  if (!session) {
    redirect("/login?callbackUrl=/kritik/spiele");
  }

  const data = await getProfileData(session);
  if (!data) redirect("/login");
  const { user } = data;

  const { data: games, error } = await safeQuery(
    db
      .select({
        id: mediaItems.id,
        title: mediaItems.title,
        description: mediaItems.description,
        image: mediaItems.image,
        type: mediaItems.type,
        avgRating: sql`AVG(${mediaReviews.rating})`,
        reviewCount: sql`COUNT(${mediaReviews.id})`,
      })
      .from(mediaItems)
      .leftJoin(mediaReviews, eq(mediaItems.id, mediaReviews.itemId))
      .where(eq(mediaItems.type, "game"))
      .groupBy(mediaItems.id)
      .orderBy(sql`${mediaItems.updatedAt} DESC`),
  );

  return (
    <AppShell user={user} session={session}>
      {error && (
        <div className="p-6">
          <InlineError />
        </div>
      )}
      <GamesClient initialGames={games || []} />
    </AppShell>
  );
}
