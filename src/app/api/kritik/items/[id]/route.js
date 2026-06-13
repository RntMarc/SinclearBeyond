import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { phpFetch } from "@/lib/api/phpClient";

export async function GET(_req, { params }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const result = await phpFetch(`/media/${id}/detail`);
    if (!result.ok) {
      if (result.status === 404) {
        return NextResponse.json({ error: "Not Found" }, { status: 404 });
      }
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 },
      );
    }

    const data = result.data?.data || result.data;

    const item = data.item || data;
    item.reviews = data.reviews || [];

    if (data.episodes) {
      item.episodes = data.episodes;
    }
    if (data.tracks) {
      item.tracks = data.tracks;
    }
    if (data.albums) {
      item.albums = data.albums;
    }

    try {
      item.links = item.links ? JSON.parse(item.links) : [];
    } catch (_e) {
      item.links = [];
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    item.needsUpdate = item.externalId && item.updatedAt < sevenDaysAgo;

    return NextResponse.json(item);
  } catch (error) {
    console.error("[API/Kritik/Items/ID] GET Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function PATCH(_req, { params }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const itemRes = await phpFetch(`/media-items/${id}`);
    if (!itemRes.ok) {
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }
    const item = itemRes.data;

    if (!item.externalId) {
      return NextResponse.json({ error: "No external ID" }, { status: 400 });
    }

    let updatedData = null;

    if (item.type === "music") {
      const { getMusicDetails } = await import("@/lib/kritik/musicbrainz");
      updatedData = await getMusicDetails(item.externalId, item.format);
    } else if (item.type === "movie") {
      const { getMovieDetails, getSeriesDetails } = await import(
        "@/lib/kritik/tmdb"
      );
      if (item.format === "series") {
        updatedData = await getSeriesDetails(item.externalId);
      } else {
        updatedData = await getMovieDetails(item.externalId);
      }
    } else if (item.type === "game") {
      const { getGameDetails } = await import("@/lib/kritik/igdb");
      updatedData = await getGameDetails(item.externalId);
    }

    if (!updatedData) {
      return NextResponse.json(
        { error: "Failed to fetch data" },
        { status: 500 },
      );
    }

    const updateResult = await phpFetch(`/media-items/${id}`, {
      method: "PATCH",
      body: {
        title: updatedData.title,
        description: updatedData.description,
        image: updatedData.image,
        releaseDate: updatedData.releaseDate,
        links: JSON.stringify(updatedData.links),
        updatedAt: new Date().toISOString(),
      },
    });

    if (!updateResult.ok) throw new Error(updateResult.error);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[API/Kritik/Items/ID] PATCH Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
