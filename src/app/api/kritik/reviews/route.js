import crypto from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/db";
import { mediaItems, mediaReviews, users } from "@/lib/db/schema";

export async function GET(req) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const itemId = searchParams.get("itemId");

  if (!itemId) {
    return NextResponse.json({ error: "itemId is required" }, { status: 400 });
  }

  try {
    const reviews = await db
      .select({
        id: mediaReviews.id,
        rating: mediaReviews.rating,
        comment: mediaReviews.comment,
        platform: mediaReviews.platform,
        createdAt: mediaReviews.createdAt,
        user: {
          id: users.id,
          displayName: users.displayName,
          image: users.image,
        },
      })
      .from(mediaReviews)
      .innerJoin(users, eq(mediaReviews.userId, users.id))
      .where(eq(mediaReviews.itemId, itemId))
      .orderBy(sql`${mediaReviews.createdAt} DESC`);

    return NextResponse.json(reviews);
  } catch (error) {
    console.error("[API/Kritik/Reviews] GET Error:", error);
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
    const { itemId, rating, comment, platform } = data;

    if (!itemId || !rating) {
      return NextResponse.json(
        { error: "itemId and rating are required" },
        { status: 400 },
      );
    }

    const now = new Date();

    // Check if review already exists from this user for this item
    const [existingReview] = await db
      .select()
      .from(mediaReviews)
      .where(
        and(
          eq(mediaReviews.itemId, itemId),
          eq(mediaReviews.userId, session.sub),
        ),
      )
      .limit(1);

    let id = existingReview?.id;

    if (existingReview) {
      await db
        .update(mediaReviews)
        .set({
          rating: parseInt(rating, 10),
          comment,
          platform,
          createdAt: now, // Update date to show it was refreshed
        })
        .where(eq(mediaReviews.id, existingReview.id));
    } else {
      id = crypto.randomUUID();
      await db.insert(mediaReviews).values({
        id,
        itemId,
        userId: session.sub,
        rating: parseInt(rating, 10),
        comment,
        platform,
        createdAt: now,
      });
    }

    // Update the item's updatedAt timestamp
    await db
      .update(mediaItems)
      .set({ updatedAt: now })
      .where(eq(mediaItems.id, itemId));

    return NextResponse.json({ ok: true, id });
  } catch (error) {
    console.error("[API/Kritik/Reviews] POST Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
