import crypto from "node:crypto";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/db";
import {
  discoverGastronomy,
  discoverPlaces,
  discoverReviews,
} from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(req) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");

  try {
    let query = db
      .select({
        id: discoverPlaces.id,
        name: discoverPlaces.name,
        address: discoverPlaces.address,
        category: discoverPlaces.category,
        avgRating: sql`AVG(${discoverReviews.rating})`,
        reviewCount: sql`COUNT(${discoverReviews.id})`,
      })
      .from(discoverPlaces)
      .leftJoin(discoverReviews, eq(discoverPlaces.id, discoverReviews.placeId))
      .groupBy(discoverPlaces.id);

    if (category) {
      query = query.where(eq(discoverPlaces.category, category));
    }

    const places = await query;
    return NextResponse.json(places);
  } catch (error) {
    console.error("[API/Discover/Places] GET Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(req) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = await req.json();
    const {
      name,
      category,
      address,
      latitude,
      longitude,
      osmId,
      osmType,
      phone,
      website,
      email,
      openingHours,
      cuisine,
      rating,
      comment,
    } = data;

    if (!name || !category) {
      return NextResponse.json(
        { error: "Name and category are required" },
        { status: 400 },
      );
    }

    const placeId = crypto.randomUUID();
    const now = new Date();

    await db.insert(discoverPlaces).values({
      id: placeId,
      name,
      category,
      address,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      osmId: osmId ? parseInt(osmId) : null,
      osmType: osmType || null,
      phone,
      website,
      email,
      openingHours,
      lastUpdated: now,
      creatorId: session.userId,
      createdAt: now,
    });

    if (category === "gastronomy") {
      await db.insert(discoverGastronomy).values({
        id: crypto.randomUUID(),
        placeId,
        cuisine,
      });
    }

    if (rating) {
      await db.insert(discoverReviews).values({
        id: crypto.randomUUID(),
        placeId,
        userId: session.userId,
        rating: parseInt(rating),
        comment,
        createdAt: now,
      });
    }

    return NextResponse.json({ ok: true, id: placeId });
  } catch (error) {
    console.error("[API/Discover/Places] POST Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
