import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { formatAddress } from "@/lib/discover/utils";
import { fetchWithTimeout } from "@/lib/utils";

export async function GET(req) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");

  if (!q) return NextResponse.json([]);

  try {
    const res = await fetchWithTimeout(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&addressdetails=1&extratags=1&limit=10`,
      {
        headers: {
          "User-Agent": "SinclearBeyond/1.0",
        },
      },
    );
    const data = await res.json();

    // Categorization logic
    const gastronomyTypes = [
      "restaurant",
      "cafe",
      "fast_food",
      "bar",
      "pub",
      "ice_cream",
      "biergarten",
      "food_court",
    ];
    const leisureTourismTypes = [
      "museum",
      "zoo",
      "theme_park",
      "viewpoint",
      "aquarium",
      "attraction",
      "gallery",
    ];
    const leisureAmenityTypes = [
      "cinema",
      "theatre",
      "arts_centre",
      "planetarium",
      "casino",
      "nightclub",
    ];

    // Transform data for our frontend
    const results = data
      .map((item) => {
        let category = null;

        if (item.class === "amenity" && gastronomyTypes.includes(item.type)) {
          category = "gastronomy";
        } else if (
          item.class === "leisure" ||
          (item.class === "tourism" &&
            leisureTourismTypes.includes(item.type)) ||
          (item.class === "amenity" && leisureAmenityTypes.includes(item.type))
        ) {
          category = "leisure";
        }

        if (!category) return null;

        return {
          osmId: item.osm_id,
          osmType:
            item.osm_type === "node"
              ? "N"
              : item.osm_type === "way"
                ? "W"
                : "R",
          name: item.display_name.split(",")[0],
          address: formatAddress(item.address),
          latitude: item.lat,
          longitude: item.lon,
          phone:
            item.extratags?.phone || item.extratags?.["contact:phone"] || "",
          website:
            item.extratags?.website ||
            item.extratags?.["contact:website"] ||
            "",
          email:
            item.extratags?.email || item.extratags?.["contact:email"] || "",
          openingHours: item.extratags?.opening_hours || "",
          cuisine: item.extratags?.cuisine || "",
          category,
          type: item.type,
          class: item.class,
        };
      })
      .filter(Boolean);

    return NextResponse.json(results);
  } catch (error) {
    console.error("[API/Discover/OSM/Search] Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
