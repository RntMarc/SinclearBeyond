import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db, safeQuery } from "@/lib/db/db";
import { mediaReviews } from "@/lib/db/schema";

export async function DELETE(_req, { params }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Check if review exists and belongs to user (or user is admin)
    const { data: reviews, error: fetchErr } = await safeQuery(
      db.select().from(mediaReviews).where(eq(mediaReviews.id, id)).limit(1),
    );

    if (fetchErr) throw fetchErr;
    const review = reviews?.[0];

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    if (review.userId !== session.sub && !session.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error: delErr } = await safeQuery(
      db.delete(mediaReviews).where(eq(mediaReviews.id, id)),
    );
    if (delErr) throw delErr;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[API/Kritik/Reviews/Delete] Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
