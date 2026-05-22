import { eq, sql } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import AppShell from "@/components/layout/Appshell";
import { InlineError } from "@/components/ui/InlineError";
import { getSessionWithSubs } from "@/lib/auth/sessionExtended";
import { db, safeQuery } from "@/lib/db/db";
import { mediaItems, mediaReviews, users } from "@/lib/db/schema";
import { getProfileData } from "@/lib/profile/profile";
import MovieDetailPageClient from "./MovieDetailPageClient";

export default async function MovieDetailPage({ params }) {
  const { id } = await params;
  const session = await getSessionWithSubs();

  if (!session) {
    redirect(`/login?callbackUrl=/kritik/filme/${id}`);
  }

  const profileData = await getProfileData(session);
  if (!profileData) redirect("/login");
  const { user } = profileData;

  const { data: movieResult, error: movieError } = await safeQuery(
    db
      .select({
        id: mediaItems.id,
        title: mediaItems.title,
        description: mediaItems.description,
        image: mediaItems.image,
        type: mediaItems.type,
        format: mediaItems.format,
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

  if (movieError) {
    return (
      <AppShell user={user} session={session}>
        <div className="p-6">
          <InlineError />
        </div>
      </AppShell>
    );
  }

  if (!movieResult || movieResult.length === 0) {
    notFound();
  }

  const movie = movieResult[0];

  // If it's a series, fetch episodes
  let episodesError = false;
  if (movie.type === "movie" && movie.format === "series") {
    const { episodeReviews, seriesEpisodes } = await import("@/lib/db/schema");
    const { data: episodes, error } = await safeQuery(
      db
        .select({
          id: seriesEpisodes.id,
          seasonNumber: seriesEpisodes.seasonNumber,
          episodeNumber: seriesEpisodes.episodeNumber,
          title: seriesEpisodes.title,
          releaseDate: seriesEpisodes.releaseDate,
          avgRating: sql`AVG(${episodeReviews.rating})`,
          reviewCount: sql`COUNT(${episodeReviews.id})`,
          userRating: sql`MAX(CASE WHEN ${episodeReviews.userId} = ${session.sub} THEN ${episodeReviews.rating} ELSE NULL END)`,
        })
        .from(seriesEpisodes)
        .leftJoin(
          episodeReviews,
          eq(seriesEpisodes.id, episodeReviews.episodeId),
        )
        .where(eq(seriesEpisodes.seriesId, movie.id))
        .groupBy(seriesEpisodes.id)
        .orderBy(seriesEpisodes.seasonNumber, seriesEpisodes.episodeNumber),
    );

    movie.episodes = episodes || [];
    episodesError = error;
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
      {(episodesError || reviewsError) && (
        <div className="px-6 pt-6">
          <InlineError />
        </div>
      )}
      <MovieDetailPageClient
        movie={movie}
        reviews={reviews || []}
        userId={session.sub}
      />
    </AppShell>
  );
}
