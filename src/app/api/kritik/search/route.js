import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/db";
import { mediaItems, mediaReviews } from "@/lib/db/schema";
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

    // Enhance search results with existing database info
    const enhancedResults = await Promise.all(
      results.map(async (item) => {
        const [existing] = await db
          .select({
            id: mediaItems.id,
            avgRating: sql`AVG(${mediaReviews.rating})`,
            reviewCount: sql`COUNT(${mediaReviews.id})`,
          })
          .from(mediaItems)
          .leftJoin(mediaReviews, eq(mediaItems.id, mediaReviews.itemId))
          .where(eq(mediaItems.externalId, item.externalId))
          .groupBy(mediaItems.id)
          .limit(1);

        if (existing) {
          return {
            ...item,
            id: existing.id,
            avgRating: existing.avgRating,
            reviewCount: existing.reviewCount,
          };
        }
        return item;
      }),
    );

    return NextResponse.json(enhancedResults);
  } catch (error) {
    console.error("[API/Kritik/Search] Error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
