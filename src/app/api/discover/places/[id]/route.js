import { and, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/db";
import {
  discoverBookmarks,
  discoverGastronomy,
  discoverPlaces,
  discoverReviews,
  users,
} from "@/lib/db/schema";
import { formatOpeningHours } from "@/lib/discover/utils";

export async function GET(req, { params }) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const [place] = await db
      .select()
      .from(discoverPlaces)
      .where(eq(discoverPlaces.id, id))
      .limit(1);

    if (!place)
      return NextResponse.json({ error: "Place not found" }, { status: 404 });

    let details = {};
    if (place.category === "gastronomy") {
      const [gastro] = await db
        .select()
        .from(discoverGastronomy)
        .where(eq(discoverGastronomy.placeId, id))
        .limit(1);
      details = gastro || {};
    }

    const reviews = await db
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
      .orderBy(sql`${discoverReviews.createdAt} DESC`);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const needsUpdate = place.osmId && place.lastUpdated < thirtyDaysAgo;

    return NextResponse.json({
      ...place,
      details,
      reviews,
      needsUpdate,
      formattedOpeningHours: formatOpeningHours(place.openingHours),
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

    const [existing] = await db
      .select()
      .from(discoverPlaces)
      .where(eq(discoverPlaces.id, id))
      .limit(1);

    if (!existing)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const isRefresh =
      Object.keys(data).length > 0 &&
      existing.lastUpdated < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    if (!session.isAdmin && existing.creatorId !== session.sub && !isRefresh) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await db
      .update(discoverPlaces)
      .set({ ...data, lastUpdated: now })
      .where(eq(discoverPlaces.id, id));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[API/Discover/Places/[id]] PATCH Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(req, { params }) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const [place] = await db
      .select()
      .from(discoverPlaces)
      .where(eq(discoverPlaces.id, id))
      .limit(1);

    if (!place)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (place.creatorId !== session.sub && !session.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const otherReviews = await db
      .select()
      .from(discoverReviews)
      .where(
        and(
          eq(discoverReviews.placeId, id),
          sql`${discoverReviews.userId} != ${session.sub}`,
        ),
      );

    if (otherReviews.length > 0 && !session.isAdmin) {
      return NextResponse.json(
        { error: "Cannot delete place with reviews from others" },
        { status: 400 },
      );
    }

    await db.delete(discoverPlaces).where(eq(discoverPlaces.id, id));
    await db
      .delete(discoverGastronomy)
      .where(eq(discoverGastronomy.placeId, id));
    await db.delete(discoverReviews).where(eq(discoverReviews.placeId, id));
    await db.delete(discoverBookmarks).where(eq(discoverBookmarks.placeId, id));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[API/Discover/Places/[id]] DELETE Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
