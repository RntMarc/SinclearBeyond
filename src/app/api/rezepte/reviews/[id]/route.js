import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db, safeQuery } from "@/lib/db/db";
import { recipeReviews } from "@/lib/db/schema";

export async function PATCH(req, { params }) {
  const { id } = await params;
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { rating, comment } = await req.json();

    const { data: existing } = await safeQuery(
      db
        .select({ userId: recipeReviews.userId })
        .from(recipeReviews)
        .where(eq(recipeReviews.id, id))
        .limit(1),
    );

    if (!existing || existing.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (existing[0].userId !== session.sub && !session.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updateData = {};
    if (rating !== undefined) updateData.rating = parseInt(rating, 10);
    if (comment !== undefined) updateData.comment = comment;

    const { error: updateError } = await safeQuery(
      db.update(recipeReviews).set(updateData).where(eq(recipeReviews.id, id)),
    );

    if (updateError) {
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[API/Rezepte/Reviews] PATCH Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(_req, { params }) {
  const { id } = await params;
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: existing } = await safeQuery(
    db
      .select({ userId: recipeReviews.userId })
      .from(recipeReviews)
      .where(eq(recipeReviews.id, id))
      .limit(1),
  );

  if (!existing || existing.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (existing[0].userId !== session.sub && !session.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error: deleteError } = await safeQuery(
    db.delete(recipeReviews).where(eq(recipeReviews.id, id)),
  );

  if (deleteError) {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
