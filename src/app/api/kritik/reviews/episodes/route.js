import crypto from "node:crypto";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/db";
import { episodeReviews } from "@/lib/db/schema";

export async function GET(req) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const episodeId = searchParams.get("episodeId");

  if (!episodeId) {
    return NextResponse.json({ error: "episodeId is required" }, { status: 400 });
  }

  try {
    // Only return the current user's rating for privacy
    const reviews = await db
      .select()
      .from(episodeReviews)
      .where(
        and(
          eq(episodeReviews.episodeId, episodeId),
          eq(episodeReviews.userId, session.sub),
        ),
      );

    return NextResponse.json(reviews);
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

    const now = new Date();

    // Check if review already exists
    const [existing] = await db
      .select()
      .from(episodeReviews)
      .where(
        and(
          eq(episodeReviews.episodeId, episodeId),
          eq(episodeReviews.userId, session.sub),
        ),
      )
      .limit(1);

    if (existing) {
      if (rating === 0) {
        // Assume 0 means delete rating
        await db.delete(episodeReviews).where(eq(episodeReviews.id, existing.id));
        return NextResponse.json({ ok: true, deleted: true });
      }
      await db
        .update(episodeReviews)
        .set({
          rating: parseInt(rating, 10),
          createdAt: now,
        })
        .where(eq(episodeReviews.id, existing.id));
    } else {
      if (rating === 0) return NextResponse.json({ ok: true });
      await db.insert(episodeReviews).values({
        id: crypto.randomUUID(),
        episodeId,
        userId: session.sub,
        rating: parseInt(rating, 10),
        createdAt: now,
      });
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
