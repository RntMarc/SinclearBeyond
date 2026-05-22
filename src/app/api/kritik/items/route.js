import crypto from "node:crypto";
import { and, eq, exists, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db, safeQuery } from "@/lib/db/db";
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

    const { data: items, error } = await safeQuery(query);
    if (error) throw error;

    return NextResponse.json(items || []);
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
      const { data: existing, error: existError } = await safeQuery(
        db
          .select()
          .from(mediaItems)
          .where(eq(mediaItems.externalId, externalId))
          .limit(1),
      );
      if (existError) throw existError;

      if (existing && existing.length > 0) {
        return NextResponse.json(existing[0]);
      }
    }

    const id = crypto.randomUUID();
    const now = new Date();

    const { error: insertError } = await safeQuery(
      db.insert(mediaItems).values({
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
      }),
    );

    if (insertError) throw insertError;

    // Auto-populate episodes for series
    if (type === "movie" && format === "series" && externalId) {
      const episodes = await getSeriesEpisodes(externalId);
      if (episodes.length > 0) {
        await safeQuery(
          db.insert(seriesEpisodes).values(
            episodes.map((ep) => ({
              id: crypto.randomUUID(),
              seriesId: id,
              seasonNumber: ep.seasonNumber,
              episodeNumber: ep.episodeNumber,
              title: ep.title,
              externalId: ep.externalId,
              releaseDate: ep.releaseDate,
            })),
          ),
        );
      }
    }

    // Auto-populate tracks and songs for albums
    if (type === "music" && format === "album" && externalId) {
      const tracks = await getAlbumTracks(externalId);
      for (const track of tracks) {
        // Check if song already exists
        let songId;
        const { data: existingSongs, error: songExistErr } = await safeQuery(
          db
            .select()
            .from(mediaItems)
            .where(eq(mediaItems.externalId, track.songExternalId))
            .limit(1),
        );

        if (songExistErr) {
          console.error(
            `[API/Kritik/Items] DB error checking for song ${track.songExternalId}:`,
            songExistErr,
          );
        }

        const existingSong = existingSongs?.[0];

        if (existingSong) {
          songId = existingSong.id;
        } else {
          songId = crypto.randomUUID();
          const songArtist = track.artist || title.split(" - ")[0];
          await safeQuery(
            db.insert(mediaItems).values({
              id: songId,
              type: "music",
              format: "song",
              title: `${songArtist} - ${track.title}`,
              image: image,
              externalId: track.songExternalId,
              releaseDate: track.releaseDate,
              creatorId: session.sub,
              createdAt: now,
              updatedAt: now,
            }),
          );
        }

        // Link song to album
        await safeQuery(
          db.insert(albumTracks).values({
            id: crypto.randomUUID(),
            albumId: id,
            songId,
            trackNumber: track.trackNumber,
          }),
        );
      }
    }

    const { data: newItems, error: finalError } = await safeQuery(
      db.select().from(mediaItems).where(eq(mediaItems.id, id)).limit(1),
    );

    if (finalError) throw finalError;

    return NextResponse.json(newItems?.[0]);
  } catch (error) {
    console.error("[API/Kritik/Items] POST Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
