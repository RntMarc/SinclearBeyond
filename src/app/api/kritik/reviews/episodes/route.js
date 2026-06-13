import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { phpFetch } from "@/lib/api/phpClient";

export async function GET(req) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const episodeId = searchParams.get("episodeId");

  if (!episodeId) {
    return NextResponse.json(
      { error: "episodeId is required" },
      { status: 400 },
    );
  }

  try {
    const result = await phpFetch(
      `/episode-reviews?episodeId=${episodeId}&userId=${session.sub}`,
    );

    return NextResponse.json(result.ok ? result.data || [] : []);
  } catch (error) {
    console.error("[API/Kritik/Reviews/Episodes] GET Error:", error);
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
    const { episodeId, rating } = data;

    if (!episodeId || rating === undefined) {
      return NextResponse.json(
        { error: "episodeId and rating are required" },
        { status: 400 },
      );
    }

    // Check if review already exists
    const existingRes = await phpFetch(
      `/episode-reviews?episodeId=${episodeId}&userId=${session.sub}&limit=1`,
    );
    const existing =
      existingRes.ok && existingRes.data?.[0] ? existingRes.data[0] : null;

    if (existing) {
      if (rating === 0) {
        const delResult = await phpFetch(`/episode-reviews/${existing.id}`, {
          method: "DELETE",
        });
        if (!delResult.ok) throw new Error(delResult.error);
        return NextResponse.json({ ok: true, deleted: true });
      }
      const updateResult = await phpFetch(`/episode-reviews/${existing.id}`, {
        method: "PATCH",
        body: { rating: parseInt(rating, 10) },
      });
      if (!updateResult.ok) throw new Error(updateResult.error);
    } else {
      if (rating === 0) return NextResponse.json({ ok: true });
      const createResult = await phpFetch("/episode-reviews", {
        method: "POST",
        body: {
          episodeId,
          userId: session.sub,
          rating: parseInt(rating, 10),
        },
      });
      if (!createResult.ok) throw new Error(createResult.error);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[API/Kritik/Reviews/Episodes] POST Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
