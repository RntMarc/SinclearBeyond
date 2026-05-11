import crypto from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/db";
import {
  discoverGastronomy,
  discoverPlaces,
  discoverReviews,
} from "@/lib/db/schema";
import { getOpeningStatus } from "@/lib/discover/utils";

export async function GET(req) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const q = searchParams.get("q");
  const mode = searchParams.get("mode"); // "in" or "around"
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");
  const radius = searchParams.get("radius");
  const random = searchParams.get("random");
  const locationName = searchParams.get("locationName");

  try {
    let query = db
      .select({
        id: discoverPlaces.id,
        name: discoverPlaces.name,
        address: discoverPlaces.address,
        category: discoverPlaces.category,
        latitude: discoverPlaces.latitude,
        longitude: discoverPlaces.longitude,
        openingHours: discoverPlaces.openingHours,
        avgRating: sql`AVG(${discoverReviews.rating})`,
        reviewCount: sql`COUNT(${discoverReviews.id})`,
      })
      .from(discoverPlaces)
      .leftJoin(discoverReviews, eq(discoverPlaces.id, discoverReviews.placeId))
      .groupBy(discoverPlaces.id);

    const conditions = [];

    if (category) {
      conditions.push(eq(discoverPlaces.category, category));
    }

    if (q) {
      conditions.push(
        sql`${discoverPlaces.name} LIKE ${`%${q}%`} OR ${discoverPlaces.address} LIKE ${`%${q}%`}`,
      );
    }

    if (mode === "around" && lat && lon && radius) {
      const r = parseFloat(radius);
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lon);

      // Haversine formula for distance in km
      conditions.push(
        sql`(6371 * acos(cos(radians(${latitude})) * cos(radians(${discoverPlaces.latitude})) * cos(radians(${discoverPlaces.longitude}) - radians(${longitude})) + sin(radians(${latitude})) * sin(radians(${discoverPlaces.latitude})))) <= ${r}`,
      );
    } else if (mode === "in" && lat && lon) {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lon);

      let inCondition = sql`(6371 * acos(cos(radians(${latitude})) * cos(radians(${discoverPlaces.latitude})) * cos(radians(${discoverPlaces.longitude}) - radians(${longitude})) + sin(radians(${latitude})) * sin(radians(${discoverPlaces.latitude})))) <= 15`;

      if (locationName) {
        const cityPart = locationName.split(",")[0].trim();
        inCondition = sql`${inCondition} OR ${discoverPlaces.address} LIKE ${`%${cityPart}%`}`;
      }

      conditions.push(inCondition);
    }

    if (conditions.length > 0) {
      query = query.where(sql`${sql.join(conditions, sql` AND `)}`);
    }

    if (random) {
      query = query.orderBy(sql`RAND()`).limit(parseInt(random, 10));
    } else {
      query = query.orderBy(sql`${discoverPlaces.name} ASC`);
    }

    const places = await query;
    const placesWithStatus = places.map((p) => ({
      ...p,
      openingStatus: getOpeningStatus(p.openingHours),
    }));

    return NextResponse.json(placesWithStatus);
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
      osmId: osmId ? parseInt(osmId, 10) : null,
      osmType: osmType || null,
      phone,
      website,
      email,
      openingHours,
      lastUpdated: now,
      creatorId: session.sub,
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
        userId: session.sub,
        rating: parseInt(rating, 10),
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
