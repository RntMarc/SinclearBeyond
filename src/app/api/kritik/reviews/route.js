import crypto from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db, safeQuery } from "@/lib/db/db";
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
    const { data: reviews, error } = await safeQuery(
      db
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
        .orderBy(sql`${mediaReviews.createdAt} DESC`),
    );

    if (error) throw error;

    return NextResponse.json(reviews || []);
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
    const { data: existingData, error: existErr } = await safeQuery(
      db
        .select()
        .from(mediaReviews)
        .where(
          and(
            eq(mediaReviews.itemId, itemId),
            eq(mediaReviews.userId, session.sub),
          ),
        )
        .limit(1),
    );

    if (existErr) throw existErr;
    const existingReview = existingData?.[0];

    let id = existingReview?.id;

    if (existingReview) {
      const { error: upErr } = await safeQuery(
        db
          .update(mediaReviews)
          .set({
            rating: parseInt(rating, 10),
            comment,
            platform,
            createdAt: now, // Update date to show it was refreshed
          })
          .where(eq(mediaReviews.id, existingReview.id)),
      );
      if (upErr) throw upErr;
    } else {
      id = crypto.randomUUID();
      const { error: inErr } = await safeQuery(
        db.insert(mediaReviews).values({
          id,
          itemId,
          userId: session.sub,
          rating: parseInt(rating, 10),
          comment,
          platform,
          createdAt: now,
        }),
      );
      if (inErr) throw inErr;
    }

    // Update the item's updatedAt timestamp
    const { error: upItemErr } = await safeQuery(
      db
        .update(mediaItems)
        .set({ updatedAt: now })
        .where(eq(mediaItems.id, itemId)),
    );

    if (upItemErr) {
      console.error(
        `[API/Kritik/Reviews] Failed to update item ${itemId} timestamp:`,
        upItemErr,
      );
    }

    return NextResponse.json({ ok: true, id });
  } catch (error) {
    console.error("[API/Kritik/Reviews] POST Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
