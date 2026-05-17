import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/db";
import {
  albumTracks,
  episodeReviews,
  mediaItems,
  mediaReviews,
  seriesEpisodes,
} from "@/lib/db/schema";

export async function GET(_req, { params }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const items = await db
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
      .limit(1);

    if (items.length === 0) {
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }

    const item = items[0];

    // Add extra data based on type
    if (item.type === "movie" && item.format === "series") {
      const episodes = await db
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
        .where(eq(seriesEpisodes.seriesId, item.id))
        .groupBy(seriesEpisodes.id)
        .orderBy(seriesEpisodes.seasonNumber, seriesEpisodes.episodeNumber);

      item.episodes = episodes;
    }

    if (item.type === "music") {
      if (item.format === "album") {
        const tracks = await db
          .select({
            id: mediaItems.id,
            title: mediaItems.title,
            format: mediaItems.format,
            trackNumber: albumTracks.trackNumber,
            avgRating: sql`AVG(${mediaReviews.rating})`,
            reviewCount: sql`COUNT(${mediaReviews.id})`,
          })
          .from(albumTracks)
          .innerJoin(mediaItems, eq(albumTracks.songId, mediaItems.id))
          .leftJoin(mediaReviews, eq(mediaItems.id, mediaReviews.itemId))
          .where(eq(albumTracks.albumId, item.id))
        .groupBy(mediaItems.id, albumTracks.trackNumber)
          .orderBy(albumTracks.trackNumber);

        item.tracks = tracks;
      } else if (item.format === "song") {
        const albumsResult = await db
          .select({
            id: mediaItems.id,
            title: mediaItems.title,
            image: mediaItems.image,
            format: mediaItems.format,
          })
          .from(albumTracks)
          .innerJoin(mediaItems, eq(albumTracks.albumId, mediaItems.id))
          .where(eq(albumTracks.songId, item.id));

        // For each album, get all tracks
        const albumsWithTracks = await Promise.all(
          albumsResult.map(async (album) => {
            const tracks = await db
              .select({
                id: mediaItems.id,
                title: mediaItems.title,
                format: mediaItems.format,
                trackNumber: albumTracks.trackNumber,
                avgRating: sql`AVG(${mediaReviews.rating})`,
                reviewCount: sql`COUNT(${mediaReviews.id})`,
              })
              .from(albumTracks)
              .innerJoin(mediaItems, eq(albumTracks.songId, mediaItems.id))
              .leftJoin(mediaReviews, eq(mediaItems.id, mediaReviews.itemId))
              .where(eq(albumTracks.albumId, album.id))
              .groupBy(mediaItems.id, albumTracks.trackNumber)
              .orderBy(albumTracks.trackNumber);
            return { ...album, tracks };
          }),
        );

        item.albums = albumsWithTracks;
      }
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error("[API/Kritik/Items/ID] GET Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
