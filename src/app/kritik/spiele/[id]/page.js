import { eq, sql } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import AppShell from "@/components/layout/Appshell";
import { getSessionWithSubs } from "@/lib/auth/sessionExtended";
import { db } from "@/lib/db/db";
import { mediaItems, mediaReviews, users } from "@/lib/db/schema";
import { getProfileData } from "@/lib/profile/profile";
import GameDetailPageClient from "./GameDetailPageClient";

export default async function GameDetailPage({ params }) {
  const { id } = await params;
  const session = await getSessionWithSubs();

  if (!session) {
    redirect(`/login?callbackUrl=/kritik/spiele/${id}`);
  }

  const data = await getProfileData(session);
  if (!data) redirect("/login");
  const { user } = data;

  const gameResult = await db
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
    .limit(1);

  if (gameResult.length === 0) {
    notFound();
  }

  const reviews = await db
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
    .orderBy(sql`${mediaReviews.createdAt} DESC`);

  return (
    <AppShell user={user} session={session}>
      <GameDetailPageClient game={gameResult[0]} reviews={reviews} />
    </AppShell>
  );
}
