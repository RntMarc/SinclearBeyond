import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getOpeningStatus } from "@/lib/discover/utils";
import { phpFetch } from "@/lib/api/phpClient";

export async function GET(req) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const q = searchParams.get("q");
  const mode = searchParams.get("mode");
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");
  const radius = searchParams.get("radius");
  const random = searchParams.get("random");
  const locationName = searchParams.get("locationName");

  try {
    const queryParams = new URLSearchParams();
    if (category) queryParams.set("category", category);
    if (q) queryParams.set("q", q);
    if (mode) queryParams.set("mode", mode);
    if (lat) queryParams.set("lat", lat);
    if (lon) queryParams.set("lon", lon);
    if (radius) queryParams.set("radius", radius);
    if (random) queryParams.set("random", random);
    if (locationName) queryParams.set("locationName", locationName);

    const result = await phpFetch(`/discover/places-search?${queryParams.toString()}`);
    if (!result.ok) {
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 },
      );
    }

    const places = result.data?.data || [];
    const placesWithStatus = places.map((p) => ({
      ...p,
      openingStatus: getOpeningStatus(p.openingHours, session?.timezone),
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

    const placeResult = await phpFetch("/discover-places", {
      method: "POST",
      body: {
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
        creatorId: session.sub,
      },
    });

    if (!placeResult.ok) throw new Error(placeResult.error);
    const placeId = placeResult.data?.data?.id;

    if (category === "gastronomy") {
      const gastroResult = await phpFetch("/discover-gastronomy", {
        method: "POST",
        body: { placeId, cuisine },
      });
      if (!gastroResult.ok) throw new Error(gastroResult.error);
    }

    if (rating) {
      const reviewResult = await phpFetch("/discover-reviews", {
        method: "POST",
        body: {
          placeId,
          userId: session.sub,
          rating: parseInt(rating, 10),
          comment,
        },
      });
      if (!reviewResult.ok) throw new Error(reviewResult.error);
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
