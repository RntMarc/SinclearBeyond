import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { phpFetch } from "@/lib/api/phpClient";

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
      const { searchGames } = await import("@/lib/kritik/igdb");
      results = await searchGames(q);
    } else if (type === "movie") {
      const { searchMovies } = await import("@/lib/kritik/tmdb");
      results = await searchMovies(q);
    } else if (type === "music") {
      const { searchMusic } = await import("@/lib/kritik/musicbrainz");
      results = await searchMusic(q);
    }

    // Enhance search results with existing database info
    const enhancedResults = await Promise.all(
      results.map(async (item) => {
        try {
          const existingRes = await phpFetch(
            `/media-items?filter[externalId]=${item.externalId}&limit=1`,
          );
          const existing = existingRes.ok
            ? existingRes.data?.data?.[0]
            : null;

          if (existing) {
            // Get review stats
            const statsRes = await phpFetch(`/media/${existing.id}/reviews`);
            const reviews = statsRes.ok ? (statsRes.data?.data || []) : [];
            const avgRating =
              reviews.length > 0
                ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) /
                  reviews.length
                : null;

            return {
              ...item,
              id: existing.id,
              avgRating: avgRating ? Math.round(avgRating * 10) / 10 : null,
              reviewCount: reviews.length,
            };
          }
          return item;
        } catch (error) {
          console.error(
            `[API/Kritik/Search] DB error for item ${item.externalId}:`,
            error,
          );
          return item;
        }
      }),
    );

    return NextResponse.json(enhancedResults);
  } catch (error) {
    console.error("[API/Kritik/Search] Error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
