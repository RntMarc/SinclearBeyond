import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db, safeQuery } from "@/lib/db/db";
import {
  albumTracks,
  episodeReviews,
  mediaItems,
  mediaReviews,
  seriesEpisodes,
} from "@/lib/db/schema";
import { getGameDetails } from "@/lib/kritik/igdb";
import { getMusicDetails } from "@/lib/kritik/musicbrainz";
import { getMovieDetails, getSeriesDetails } from "@/lib/kritik/tmdb";

export async function GET(_req, { params }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const { data: items, error: itemError } = await safeQuery(
      db
        .select({
          id: mediaItems.id,
          title: mediaItems.title,
          description: mediaItems.description,
          image: mediaItems.image,
          type: mediaItems.type,
          format: mediaItems.format,
          releaseDate: mediaItems.releaseDate,
          links: mediaItems.links,
          updatedAt: mediaItems.updatedAt,
          externalId: mediaItems.externalId,
          avgRating: sql`AVG(${mediaReviews.rating})`,
          reviewCount: sql`COUNT(${mediaReviews.id})`,
        })
        .from(mediaItems)
        .leftJoin(mediaReviews, eq(mediaItems.id, mediaReviews.itemId))
        .where(eq(mediaItems.id, id))
        .groupBy(mediaItems.id)
        .limit(1),
    );

    if (itemError) throw itemError;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }

    const item = items[0];

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    item.needsUpdate = item.externalId && item.updatedAt < sevenDaysAgo;

    try {
      item.links = item.links ? JSON.parse(item.links) : [];
    } catch (e) {
      item.links = [];
    }

    // Add extra data based on type
    if (item.type === "movie" && item.format === "series") {
      const { data: episodes, error: epsError } = await safeQuery(
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
          .where(eq(seriesEpisodes.seriesId, item.id))
          .groupBy(seriesEpisodes.id)
          .orderBy(seriesEpisodes.seasonNumber, seriesEpisodes.episodeNumber),
      );

      if (epsError) throw epsError;
      item.episodes = episodes || [];
    }

    if (item.type === "music") {
      if (item.format === "album") {
        const { data: tracks, error: tracksError } = await safeQuery(
          db
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
            .orderBy(albumTracks.trackNumber),
        );

        if (tracksError) throw tracksError;
        item.tracks = tracks || [];
      } else if (item.format === "song") {
        const { data: albumsResult, error: albError } = await safeQuery(
          db
            .select({
              id: mediaItems.id,
              title: mediaItems.title,
              image: mediaItems.image,
              format: mediaItems.format,
            })
            .from(albumTracks)
            .innerJoin(mediaItems, eq(albumTracks.albumId, mediaItems.id))
            .where(eq(albumTracks.songId, item.id)),
        );

        if (albError) throw albError;

        // For each album, get all tracks
        const albumsWithTracks = await Promise.all(
          (albumsResult || []).map(async (album) => {
            const { data: tracks, error: tErr } = await safeQuery(
              db
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
                .orderBy(albumTracks.trackNumber),
            );
            if (tErr) {
              console.error(
                `[API/Kritik/Items/ID] Track load error for album ${album.id}:`,
                tErr,
              );
              return { ...album, tracks: [] };
            }
            return { ...album, tracks: tracks || [] };
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

export async function PATCH(req, { params }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const { data: items, error: itemFetchError } = await safeQuery(
      db.select().from(mediaItems).where(eq(mediaItems.id, id)).limit(1),
    );

    if (itemFetchError) throw itemFetchError;
    const item = items?.[0];

    if (!item) {
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }

    if (!item.externalId) {
      return NextResponse.json({ error: "No external ID" }, { status: 400 });
    }

    let updatedData = null;

    if (item.type === "music") {
      updatedData = await getMusicDetails(item.externalId, item.format);
    } else if (item.type === "movie") {
      if (item.format === "series") {
        updatedData = await getSeriesDetails(item.externalId);
      } else {
        updatedData = await getMovieDetails(item.externalId);
      }
    } else if (item.type === "game") {
      updatedData = await getGameDetails(item.externalId);
    }

    if (!updatedData) {
      return NextResponse.json(
        { error: "Failed to fetch data" },
        { status: 500 },
      );
    }

    const { error: updateError } = await safeQuery(
      db
        .update(mediaItems)
        .set({
          title: updatedData.title,
          description: updatedData.description,
          image: updatedData.image,
          releaseDate: updatedData.releaseDate,
          links: JSON.stringify(updatedData.links),
          updatedAt: new Date(),
        })
        .where(eq(mediaItems.id, id)),
    );

    if (updateError) throw updateError;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[API/Kritik/Items/ID] PATCH Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
