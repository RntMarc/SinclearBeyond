import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { formatAddress, translateCuisine } from "@/lib/discover/utils";

export async function GET(req, { params }) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "N"; // N=Node, W=Way, R=Relation

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/lookup?osm_ids=${type}${id}&format=json&addressdetails=1&extratags=1`,
      {
        headers: {
          "User-Agent": "SinclearBeyond/1.0",
        },
      },
    );
    const data = await res.json();
    if (!data || data.length === 0)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const item = data[0];
    const result = {
      osmId: item.osm_id,
      osmType: type,
      name: item.display_name.split(",")[0],
      address: formatAddress(item.address),
      latitude: item.lat,
      longitude: item.lon,
      phone: item.extratags?.phone || item.extratags?.["contact:phone"] || "",
      website:
        item.extratags?.website || item.extratags?.["contact:website"] || "",
      email: item.extratags?.email || item.extratags?.["contact:email"] || "",
      openingHours: item.extratags?.opening_hours || "",
      cuisine: translateCuisine(item.extratags?.cuisine),
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("[API/Discover/OSM/Details] Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
