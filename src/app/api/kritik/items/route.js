import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { phpFetch } from "@/lib/api/phpClient";

export async function GET(req) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

  try {
    const result = await phpFetch(`/media/list?type=${type || "game"}`);
    if (!result.ok) {
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 },
      );
    }

    return NextResponse.json(result.data?.data || []);
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
      const existingRes = await phpFetch(
        `/media-items?filter[externalId]=${externalId}&limit=1`,
      );
      const existing = existingRes.ok
        ? existingRes.data?.data || []
        : [];

      if (existing.length > 0) {
        return NextResponse.json(existing[0]);
      }
    }

    // Create media item via generic CRUD
    const createResult = await phpFetch("/media-items", {
      method: "POST",
      body: {
        title,
        type,
        format,
        description,
        image,
        externalId,
        releaseDate,
        creatorId: session.sub,
      },
    });

    if (!createResult.ok) {
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    const id = createResult.data?.data?.id;

    // Auto-populate episodes for series
    if (type === "movie" && format === "series" && externalId) {
      const { getSeriesEpisodes } = await import("@/lib/kritik/tmdb");
      const episodes = await getSeriesEpisodes(externalId);
      if (episodes.length > 0) {
        for (const ep of episodes) {
          await phpFetch("/series-episodes", {
            method: "POST",
            body: {
              seriesId: id,
              seasonNumber: ep.seasonNumber,
              episodeNumber: ep.episodeNumber,
              title: ep.title,
              externalId: ep.externalId,
              releaseDate: ep.releaseDate,
            },
          });
        }
      }
    }

    // Auto-populate tracks and songs for albums
    if (type === "music" && format === "album" && externalId) {
      const { getAlbumTracks } = await import("@/lib/kritik/musicbrainz");
      const tracks = await getAlbumTracks(externalId);
      for (const track of tracks) {
        // Check if song already exists
        let songId;
        const songRes = await phpFetch(
          `/media-items?filter[externalId]=${track.songExternalId}&limit=1`,
        );
        const existingSongs = songRes.ok
          ? songRes.data?.data || []
          : [];

        if (existingSongs.length > 0) {
          songId = existingSongs[0].id;
        } else {
          const songArtist = track.artist || title.split(" - ")[0];
          const songRes = await phpFetch("/media-items", {
            method: "POST",
            body: {
              type: "music",
              format: "song",
              title: `${songArtist} - ${track.title}`,
              image: image,
              externalId: track.songExternalId,
              releaseDate: track.releaseDate,
              creatorId: session.sub,
            },
          });
          songId = songRes.data?.data?.id;
        }

        // Link song to album
        await phpFetch("/album-tracks", {
          method: "POST",
          body: {
            albumId: id,
            songId,
            trackNumber: track.trackNumber,
          },
        });
      }
    }

    // Return the created item
    const itemRes = await phpFetch(`/media-items/${id}`);
    return NextResponse.json(itemRes.data?.data || itemRes.data);
  } catch (error) {
    console.error("[API/Kritik/Items] POST Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
