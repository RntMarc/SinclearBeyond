import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { searchGames } from "@/lib/kritik/igdb";
import { searchMusic } from "@/lib/kritik/musicbrainz";
import { searchMovies } from "@/lib/kritik/tmdb";

export async function GET(req) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  const type = searchParams.get("type") || "game";

  if (!q) {
    return NextResponse.json([]);
  }

  try {
    let results = [];
    if (type === "game") {
      results = await searchGames(q);
    } else if (type === "movie") {
      results = await searchMovies(q);
    } else if (type === "music") {
      results = await searchMusic(q);
    }
    return NextResponse.json(results);
  } catch (error) {
    console.error("[API/Kritik/Search] Error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
