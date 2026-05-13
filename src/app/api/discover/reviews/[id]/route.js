import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/db";
import { discoverReviews } from "@/lib/db/schema";

export async function PATCH(req, { params }) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const { rating, comment } = await req.json();

    if (!rating) {
      return NextResponse.json(
        { error: "Rating is required" },
        { status: 400 },
      );
    }

    const [review] = await db
      .select()
      .from(discoverReviews)
      .where(eq(discoverReviews.id, id))
      .limit(1);

    if (!review)
      return NextResponse.json({ error: "Review not found" }, { status: 404 });

    if (review.userId !== session.sub && !session.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await db
      .update(discoverReviews)
      .set({
        rating: parseInt(rating, 10),
        comment,
      })
      .where(eq(discoverReviews.id, id));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[API/Discover/Reviews/[id]] PATCH Error:", error);
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
    const [review] = await db
      .select()
      .from(discoverReviews)
      .where(eq(discoverReviews.id, id))
      .limit(1);

    if (!review)
      return NextResponse.json({ error: "Review not found" }, { status: 404 });

    if (review.userId !== session.sub && !session.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await db.delete(discoverReviews).where(eq(discoverReviews.id, id));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[API/Discover/Reviews/[id]] DELETE Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
