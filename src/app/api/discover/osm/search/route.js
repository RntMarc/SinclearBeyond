import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { formatAddress } from "@/lib/discover/utils";

export async function GET(req) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");

  if (!q) return NextResponse.json([]);

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&addressdetails=1&extratags=1&limit=10`,
      {
        headers: {
          "User-Agent": "SinclearBeyond/1.0",
        },
      },
    );
    const data = await res.json();

    // Transform data for our frontend
    const results = data.map((item) => ({
      osmId: item.osm_id,
      osmType:
        item.osm_type === "node" ? "N" : item.osm_type === "way" ? "W" : "R",
      name: item.display_name.split(",")[0],
      address: formatAddress(item.address),
      latitude: item.lat,
      longitude: item.lon,
      phone: item.extratags?.phone || item.extratags?.["contact:phone"] || "",
      website:
        item.extratags?.website || item.extratags?.["contact:website"] || "",
      email: item.extratags?.email || item.extratags?.["contact:email"] || "",
      openingHours: item.extratags?.opening_hours || "",
      cuisine: item.extratags?.cuisine || "",
      type: item.type,
      class: item.class,
    }));

    return NextResponse.json(results);
  } catch (error) {
    console.error("[API/Discover/OSM/Search] Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
