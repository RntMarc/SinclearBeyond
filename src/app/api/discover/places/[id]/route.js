import { and, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db, safeQuery } from "@/lib/db/db";
import {
  discoverBookmarks,
  discoverGastronomy,
  discoverPlaces,
  discoverReviews,
  users,
} from "@/lib/db/schema";
import {
  formatOpeningHours,
  getOpeningStatus,
  translateCuisine,
} from "@/lib/discover/utils";

export async function GET(_req, { params }) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const { data: places, error: placeError } = await safeQuery(
      db
        .select()
        .from(discoverPlaces)
        .where(eq(discoverPlaces.id, id))
        .limit(1),
    );

    if (placeError) throw placeError;
    const place = places?.[0];

    if (!place)
      return NextResponse.json({ error: "Place not found" }, { status: 404 });

    let details = {};
    if (place.category === "gastronomy") {
      const { data: gastroData, error: gastroError } = await safeQuery(
        db
          .select()
          .from(discoverGastronomy)
          .where(eq(discoverGastronomy.placeId, id))
          .limit(1),
      );
      if (gastroError) throw gastroError;
      details = gastroData?.[0] || {};
    }

    const { data: reviews, error: reviewsError } = await safeQuery(
      db
        .select({
          id: discoverReviews.id,
          rating: discoverReviews.rating,
          comment: discoverReviews.comment,
          createdAt: discoverReviews.createdAt,
          userId: discoverReviews.userId,
          userDisplayName: users.displayName,
          userImage: users.image,
        })
        .from(discoverReviews)
        .leftJoin(users, eq(discoverReviews.userId, users.id))
        .where(eq(discoverReviews.placeId, id))
        .orderBy(sql`${discoverReviews.createdAt} DESC`),
    );

    if (reviewsError) throw reviewsError;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const needsUpdate = place.osmId && place.lastUpdated < thirtyDaysAgo;

    return NextResponse.json({
      ...place,
      details: {
        ...details,
        cuisine: translateCuisine(details.cuisine),
      },
      reviews: reviews || [],
      needsUpdate,
      openingStatus: getOpeningStatus(place.openingHours, session?.timezone),
      formattedOpeningHours: formatOpeningHours(
        place.openingHours,
        "de",
        session?.timezone,
      ),
    });
  } catch (error) {
    console.error("[API/Discover/Places/[id]] GET Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function PATCH(req, { params }) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const data = await req.json();
    const now = new Date();

    const { data: existingData, error: existingError } = await safeQuery(
      db
        .select()
        .from(discoverPlaces)
        .where(eq(discoverPlaces.id, id))
        .limit(1),
    );

    if (existingError) throw existingError;
    const existing = existingData?.[0];

    if (!existing)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const isRefresh =
      Object.keys(data).length > 0 &&
      existing.lastUpdated < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    if (!session.isAdmin && existing.creatorId !== session.sub && !isRefresh) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error: updateError } = await safeQuery(
      db
        .update(discoverPlaces)
        .set({ ...data, lastUpdated: now })
        .where(eq(discoverPlaces.id, id)),
    );

    if (updateError) throw updateError;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[API/Discover/Places/[id]] PATCH Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(_req, { params }) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const { data: places, error: placeError } = await safeQuery(
      db
        .select()
        .from(discoverPlaces)
        .where(eq(discoverPlaces.id, id))
        .limit(1),
    );

    if (placeError) throw placeError;
    const place = places?.[0];

    if (!place)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (place.creatorId !== session.sub && !session.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: otherReviews, error: reviewsError } = await safeQuery(
      db
        .select()
        .from(discoverReviews)
        .where(
          and(
            eq(discoverReviews.placeId, id),
            sql`${discoverReviews.userId} != ${session.sub}`,
          ),
        ),
    );

    if (reviewsError) throw reviewsError;

    if (otherReviews && otherReviews.length > 0 && !session.isAdmin) {
      return NextResponse.json(
        { error: "Cannot delete place with reviews from others" },
        { status: 400 },
      );
    }

    // Delete related records first
    await safeQuery(
      db.delete(discoverGastronomy).where(eq(discoverGastronomy.placeId, id)),
    );
    await safeQuery(
      db.delete(discoverReviews).where(eq(discoverReviews.placeId, id)),
    );
    await safeQuery(
      db.delete(discoverBookmarks).where(eq(discoverBookmarks.placeId, id)),
    );

    const { error: deleteError } = await safeQuery(
      db.delete(discoverPlaces).where(eq(discoverPlaces.id, id)),
    );
    if (deleteError) throw deleteError;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[API/Discover/Places/[id]] DELETE Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
