import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/db";
import {
  discoverBookmarks,
  discoverGastronomy,
  discoverPlaces,
  discoverReviews,
  users,
} from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const place = await db.query.discoverPlaces.findFirst({
      where: eq(discoverPlaces.id, id),
    });

    if (!place)
      return NextResponse.json({ error: "Place not found" }, { status: 404 });

    let details = {};
    if (place.category === "gastronomy") {
      details =
        (await db.query.discoverGastronomy.findFirst({
          where: eq(discoverGastronomy.placeId, id),
        })) || {};
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

    // Check if it needs OSM update (30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const needsUpdate = place.osmId && place.lastUpdated < thirtyDaysAgo;

    return NextResponse.json({ ...place, details, reviews, needsUpdate });
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

    const existing = await db.query.discoverPlaces.findFirst({
      where: eq(discoverPlaces.id, id),
    });
    if (!existing)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Authorization: only creator, admin, or "system" (if we want to allow OSM refresh for anyone)
    // The requirement says "The system ensures... information stays current".
    // If it's a manual refresh button, we might want to let any user trigger it IF it's older than 30 days.
    const isRefresh =
      Object.keys(data).length > 0 &&
      existing.lastUpdated < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    if (
      !session.isAdmin &&
      existing.creatorId !== session.userId &&
      !isRefresh
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await db
      .update(discoverPlaces)
      .set({
        ...data,
        lastUpdated: now,
      })
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
    const place = await db.query.discoverPlaces.findFirst({
      where: eq(discoverPlaces.id, id),
    });

    if (!place)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Constraint: can delete if creator AND no other reviews
    const otherReviews = await db
      .select()
      .from(discoverReviews)
      .where(
        and(
          eq(discoverReviews.placeId, id),
          sql`${discoverReviews.userId} != ${session.userId}`,
        ),
      );

    if (place.creatorId !== session.userId && !session.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
