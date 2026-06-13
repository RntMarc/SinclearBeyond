import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import {
  formatOpeningHours,
  getOpeningStatus,
  translateCuisine,
} from "@/lib/discover/utils";
import { phpFetch } from "@/lib/api/phpClient";

export async function GET(_req, { params }) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const result = await phpFetch(`/discover/${id}/detail`);
    if (!result.ok) {
      if (result.status === 404) {
        return NextResponse.json({ error: "Place not found" }, { status: 404 });
      }
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 },
      );
    }

    const data = result.data?.data || result.data;

    const place = data.place || data;
    const reviews = data.reviews || [];
    const gastronomy = data.gastronomy || data.details || {};
    const isBookmarked = data.isBookmarked || false;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const needsUpdate = place.osmId && place.lastUpdated < thirtyDaysAgo;

    return NextResponse.json({
      ...place,
      details: {
        ...gastronomy,
        cuisine: translateCuisine(gastronomy.cuisine),
      },
      reviews: reviews || [],
      needsUpdate,
      openingStatus: getOpeningStatus(place.openingHours, session?.timezone),
      formattedOpeningHours: formatOpeningHours(
        place.openingHours,
        "de",
        session?.timezone,
      ),
    });
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

    const existingRes = await phpFetch(`/discover-places/${id}`);
    if (!existingRes.ok) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const existing = existingRes.data;

    const isRefresh =
      Object.keys(data).length > 0 &&
      new Date(existing.lastUpdated) <
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    if (!session.isAdmin && existing.creatorId !== session.sub && !isRefresh) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updateResult = await phpFetch(`/discover-places/${id}`, {
      method: "PATCH",
      body: { ...data, lastUpdated: new Date().toISOString() },
    });

    if (!updateResult.ok) throw new Error(updateResult.error);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[API/Discover/Places/[id]] PATCH Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(_req, { params }) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const placeRes = await phpFetch(`/discover-places/${id}`);
    if (!placeRes.ok) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const place = placeRes.data;

    if (place.creatorId !== session.sub && !session.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const otherReviewsRes = await phpFetch(
      `/discover-reviews?placeId=${id}&userId[neq]=${session.sub}`,
    );
    if (otherReviewsRes.ok && otherReviewsRes.data?.length > 0 && !session.isAdmin) {
      return NextResponse.json(
        { error: "Cannot delete place with reviews from others" },
        { status: 400 },
      );
    }

    await phpFetch(`/discover-gastronomy?placeId=${id}`, { method: "DELETE" });
    await phpFetch(`/discover-reviews?placeId=${id}`, { method: "DELETE" });
    await phpFetch(`/discover-bookmarks?placeId=${id}`, { method: "DELETE" });

    const deleteResult = await phpFetch(`/discover-places/${id}`, {
      method: "DELETE",
    });
    if (!deleteResult.ok) throw new Error(deleteResult.error);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[API/Discover/Places/[id]] DELETE Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
