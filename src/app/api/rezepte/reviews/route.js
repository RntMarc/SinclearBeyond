import crypto from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db, safeQuery } from "@/lib/db/db";
import { recipeReviews, users } from "@/lib/db/schema";

export async function GET(req) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const recipeId = searchParams.get("recipeId");

  if (!recipeId) {
    return NextResponse.json(
      { error: "recipeId is required" },
      { status: 400 },
    );
  }

  const { data, error } = await safeQuery(
    db
      .select({
        id: recipeReviews.id,
        rating: recipeReviews.rating,
        comment: recipeReviews.comment,
        createdAt: recipeReviews.createdAt,
        userId: recipeReviews.userId,
        user: {
          id: users.id,
          displayName: users.displayName,
          image: users.image,
        },
      })
      .from(recipeReviews)
      .innerJoin(users, eq(recipeReviews.userId, users.id))
      .where(eq(recipeReviews.recipeId, recipeId))
      .orderBy(sql`${recipeReviews.createdAt} DESC`),
  );

  if (error) {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json(data || []);
}

export async function POST(req) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { recipeId, rating, comment } = await req.json();

    if (!recipeId || !rating) {
      return NextResponse.json(
        { error: "Recipe ID and rating are required" },
        { status: 400 },
      );
    }

    const id = crypto.randomUUID();
    const { error: insertError } = await safeQuery(
      db.insert(recipeReviews).values({
        id,
        recipeId,
        userId: session.sub,
        rating: parseInt(rating, 10),
        comment,
        createdAt: new Date(),
      }),
    );

    if (insertError) {
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id });
  } catch (error) {
    console.error("[API/Rezepte/Reviews] POST Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
