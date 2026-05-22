import { eq, sql } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import AppShell from "@/components/layout/Appshell";
import { InlineError } from "@/components/ui/InlineError";
import { getSessionWithSubs } from "@/lib/auth/sessionExtended";
import { db, safeQuery } from "@/lib/db/db";
import { mediaItems, mediaReviews, users } from "@/lib/db/schema";
import { getProfileData } from "@/lib/profile/profile";
import GameDetailPageClient from "./GameDetailPageClient";

export default async function GameDetailPage({ params }) {
  const { id } = await params;
  const session = await getSessionWithSubs();

  if (!session) {
    redirect(`/login?callbackUrl=/kritik/spiele/${id}`);
  }

  const profileData = await getProfileData(session);
  if (!profileData) redirect("/login");
  const { user } = profileData;

  const { data: gameResult, error: gameError } = await safeQuery(
    db
      .select({
        id: mediaItems.id,
        title: mediaItems.title,
        description: mediaItems.description,
        image: mediaItems.image,
        type: mediaItems.type,
        releaseDate: mediaItems.releaseDate,
        avgRating: sql`AVG(${mediaReviews.rating})`,
        reviewCount: sql`COUNT(${mediaReviews.id})`,
      })
      .from(mediaItems)
      .leftJoin(mediaReviews, eq(mediaItems.id, mediaReviews.itemId))
      .where(eq(mediaItems.id, id))
      .groupBy(mediaItems.id)
      .limit(1),
  );

  if (gameError) {
    return (
      <AppShell user={user} session={session}>
        <div className="p-6">
          <InlineError />
        </div>
      </AppShell>
    );
  }

  if (!gameResult || gameResult.length === 0) {
    notFound();
  }

  const { data: reviews, error: reviewsError } = await safeQuery(
    db
      .select({
        id: mediaReviews.id,
        rating: mediaReviews.rating,
        comment: mediaReviews.comment,
        platform: mediaReviews.platform,
        createdAt: mediaReviews.createdAt,
        user: {
          id: users.id,
          displayName: users.displayName,
          image: users.image,
        },
      })
      .from(mediaReviews)
      .innerJoin(users, eq(mediaReviews.userId, users.id))
      .where(eq(mediaReviews.itemId, id))
      .orderBy(sql`${mediaReviews.createdAt} DESC`),
  );

  return (
    <AppShell user={user} session={session}>
      {reviewsError && (
        <div className="px-6 pt-6">
          <InlineError />
        </div>
      )}
      <GameDetailPageClient
        game={gameResult[0]}
        reviews={reviews || []}
        userId={session.sub}
      />
    </AppShell>
  );
}
