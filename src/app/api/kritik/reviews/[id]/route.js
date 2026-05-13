import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/db";
import { mediaReviews } from "@/lib/db/schema";

export async function DELETE(_req, { params }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Check if review exists and belongs to user (or user is admin)
    // For now, only owner can delete. We don't have an isAdmin check here yet but session.role could be used.
    const [review] = await db
      .select()
      .from(mediaReviews)
      .where(eq(mediaReviews.id, id))
      .limit(1);

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    if (review.userId !== session.sub && session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.delete(mediaReviews).where(eq(mediaReviews.id, id));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[API/Kritik/Reviews/Delete] Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
