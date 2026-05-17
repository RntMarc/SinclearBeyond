import crypto from "node:crypto";
import { and, eq, exists, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/db";
import {
  albumTracks,
  mediaItems,
  mediaReviews,
  seriesEpisodes,
} from "@/lib/db/schema";
import { getAlbumTracks } from "@/lib/kritik/musicbrainz";
import { getSeriesEpisodes } from "@/lib/kritik/tmdb";

export async function GET(req) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

  try {
    let query = db
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
      .groupBy(mediaItems.id);

    if (type) {
      if (type === "music") {
        // Only show music items with reviews
        query = query.where(
          and(
            eq(mediaItems.type, "music"),
            exists(
              db
                .select()
                .from(mediaReviews)
                .where(eq(mediaReviews.itemId, mediaItems.id)),
            ),
          ),
        );
      } else if (type === "movie") {
        // Filter out episodes from general movie/series view
        query = query.where(
          and(
            eq(mediaItems.type, "movie"),
            sql`${mediaItems.format} IN ('movie', 'series')`,
          ),
        );
      } else {
        query = query.where(eq(mediaItems.type, type));
      }
    }

    const items = await query;
    return NextResponse.json(items);
  } catch (error) {
    console.error("[API/Kritik/Items] GET Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(req) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await req.json();
    const { title, type, format, description, image, externalId, releaseDate } =
      data;

    if (!title || !type) {
      return NextResponse.json(
        { error: "Title and type are required" },
        { status: 400 },
      );
    }

    // Check if item already exists by externalId
    if (externalId) {
      const existing = await db
        .select()
        .from(mediaItems)
        .where(eq(mediaItems.externalId, externalId))
        .limit(1);

      if (existing.length > 0) {
        return NextResponse.json(existing[0]);
      }
    }

    const id = crypto.randomUUID();
    const now = new Date();

    await db.insert(mediaItems).values({
      id,
      title,
      type,
      format,
      description,
      image,
      externalId,
      releaseDate,
      creatorId: session.sub,
      createdAt: now,
      updatedAt: now,
    });

    // Auto-populate episodes for series
    if (type === "movie" && format === "series" && externalId) {
      const episodes = await getSeriesEpisodes(externalId);
      if (episodes.length > 0) {
        await db.insert(seriesEpisodes).values(
          episodes.map((ep) => ({
            id: crypto.randomUUID(),
            seriesId: id,
            seasonNumber: ep.seasonNumber,
            episodeNumber: ep.episodeNumber,
            title: ep.title,
            externalId: ep.externalId,
            releaseDate: ep.releaseDate,
          })),
        );
      }
    }

    // Auto-populate tracks and songs for albums
    if (type === "music" && format === "album" && externalId) {
      const tracks = await getAlbumTracks(externalId);
      for (const track of tracks) {
        // Check if song already exists
        let songId;
        const [existingSong] = await db
          .select()
          .from(mediaItems)
          .where(eq(mediaItems.externalId, track.songExternalId))
          .limit(1);

        if (existingSong) {
          songId = existingSong.id;
        } else {
          songId = crypto.randomUUID();
          await db.insert(mediaItems).values({
            id: songId,
            type: "music",
            format: "song",
            title: `${track.artist} - ${track.title}`,
            externalId: track.songExternalId,
            releaseDate: track.releaseDate,
            creatorId: session.sub,
            createdAt: now,
            updatedAt: now,
          });
        }

        // Link song to album
        await db.insert(albumTracks).values({
          id: crypto.randomUUID(),
          albumId: id,
          songId,
          trackNumber: track.trackNumber,
        });
      }
    }

    const newItem = await db
      .select()
      .from(mediaItems)
      .where(eq(mediaItems.id, id))
      .limit(1);

    return NextResponse.json(newItem[0]);
  } catch (error) {
    console.error("[API/Kritik/Items] POST Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
