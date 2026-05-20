import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/db";
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
    const discover = await db
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
      .innerJoin(discoverPlaces, eq(discoverReviews.placeId, discoverPlaces.id))
      .where(eq(discoverReviews.userId, userId));

    // Fetch Media Reviews
    const media = await db
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
      .where(eq(mediaReviews.userId, userId));

    // Fetch Episode Reviews
    const episodes = await db
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
      .where(eq(episodeReviews.userId, userId));

    return NextResponse.json({
      discover,
      media,
      episodes,
    });
  } catch (error) {
    console.error("[API/User/Export] GET Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
