import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db, safeQuery } from "@/lib/db/db";
import {
  discoverPlaces,
  discoverReviews,
  episodeReviews,
  mediaItems,
  mediaReviews,
  seriesEpisodes,
} from "@/lib/db/schema";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = session.sub;

    // Fetch Discover Reviews
    const { data: discover, error: discoverError } = await safeQuery(
      db
        .select({
          id: discoverReviews.id,
          rating: discoverReviews.rating,
          comment: discoverReviews.comment,
          createdAt: discoverReviews.createdAt,
          place: {
            name: discoverPlaces.name,
            osmId: discoverPlaces.osmId,
            osmType: discoverPlaces.osmType,
            category: discoverPlaces.category,
          },
        })
        .from(discoverReviews)
        .innerJoin(
          discoverPlaces,
          eq(discoverReviews.placeId, discoverPlaces.id),
        )
        .where(eq(discoverReviews.userId, userId)),
    );

    if (discoverError) throw discoverError;

    // Fetch Media Reviews
    const { data: media, error: mediaError } = await safeQuery(
      db
        .select({
          id: mediaReviews.id,
          rating: mediaReviews.rating,
          comment: mediaReviews.comment,
          platform: mediaReviews.platform,
          createdAt: mediaReviews.createdAt,
          item: {
            title: mediaItems.title,
            type: mediaItems.type,
            format: mediaItems.format,
            externalId: mediaItems.externalId,
          },
        })
        .from(mediaReviews)
        .innerJoin(mediaItems, eq(mediaReviews.itemId, mediaItems.id))
        .where(eq(mediaReviews.userId, userId)),
    );

    if (mediaError) throw mediaError;

    // Fetch Episode Reviews
    const { data: episodes, error: episodesError } = await safeQuery(
      db
        .select({
          id: episodeReviews.id,
          rating: episodeReviews.rating,
          createdAt: episodeReviews.createdAt,
          episode: {
            title: seriesEpisodes.title,
            seasonNumber: seriesEpisodes.seasonNumber,
            episodeNumber: seriesEpisodes.episodeNumber,
            externalId: seriesEpisodes.externalId,
          },
          series: {
            title: mediaItems.title,
            externalId: mediaItems.externalId,
          },
        })
        .from(episodeReviews)
        .innerJoin(
          seriesEpisodes,
          eq(episodeReviews.episodeId, seriesEpisodes.id),
        )
        .innerJoin(mediaItems, eq(seriesEpisodes.seriesId, mediaItems.id))
        .where(eq(episodeReviews.userId, userId)),
    );

    if (episodesError) throw episodesError;

    return NextResponse.json({
      discover: discover || [],
      media: media || [],
      episodes: episodes || [],
    });
  } catch (error) {
    console.error("[API/User/Export] GET Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
