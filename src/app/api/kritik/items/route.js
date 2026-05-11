import crypto from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/db";
import { mediaItems, mediaReviews } from "@/lib/db/schema";

export async function GET(req) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

  try {
    let query = db
      .select({
        id: mediaItems.id,
        title: mediaItems.title,
        description: mediaItems.description,
        image: mediaItems.image,
        type: mediaItems.type,
        avgRating: sql`AVG(${mediaReviews.rating})`,
        reviewCount: sql`COUNT(${mediaReviews.id})`,
      })
      .from(mediaItems)
      .leftJoin(mediaReviews, eq(mediaItems.id, mediaReviews.itemId))
      .groupBy(mediaItems.id);

    if (type) {
      query = query.where(eq(mediaItems.type, type));
    }

    const items = await query;
    return NextResponse.json(items);
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
    const { title, type, description, image, externalId, releaseDate } = data;

    if (!title || !type) {
      return NextResponse.json(
        { error: "Title and type are required" },
        { status: 400 },
      );
    }

    // Check if item already exists by externalId
    if (externalId) {
      const existing = await db
        .select()
        .from(mediaItems)
        .where(eq(mediaItems.externalId, externalId))
        .limit(1);

      if (existing.length > 0) {
        return NextResponse.json(existing[0]);
      }
    }

    const id = crypto.randomUUID();
    const now = new Date();

    await db.insert(mediaItems).values({
      id,
      title,
      type,
      description,
      image,
      externalId,
      releaseDate,
      creatorId: session.sub,
      createdAt: now,
      updatedAt: now,
    });

    const newItem = await db
      .select()
      .from(mediaItems)
      .where(eq(mediaItems.id, id))
      .limit(1);

    return NextResponse.json(newItem[0]);
  } catch (error) {
    console.error("[API/Kritik/Items] POST Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
