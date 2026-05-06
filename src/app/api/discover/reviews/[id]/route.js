import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/db";
import { discoverReviews } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function DELETE(req, { params }) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const review = await db.query.discoverReviews.findFirst({
      where: eq(discoverReviews.id, id),
    });

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
