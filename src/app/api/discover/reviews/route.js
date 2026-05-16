import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/db";
import { discoverReviews } from "@/lib/db/schema";

export async function POST(req) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { placeId, rating, comment } = await req.json();

    if (!placeId || !rating) {
      return NextResponse.json(
        { error: "Place ID and rating are required" },
        { status: 400 },
      );
    }

    const id = crypto.randomUUID();
    await db.insert(discoverReviews).values({
      id,
      placeId,
      userId: session.sub,
      rating: parseInt(rating, 10),
      comment,
      createdAt: new Date(),
    });

    return NextResponse.json({ ok: true, id });
  } catch (error) {
    console.error("[API/Discover/Reviews] POST Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
