import { and, eq, ne, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/auth";
import { db } from "@/lib/db/db";
import { feedbackSuggestions, feedbackVotes } from "@/lib/db/schema";

export async function PATCH(req, { params }) {
  const { id } = await params;
  const token = req.cookies.get("session")?.value;
  if (!token)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const payload = await verifyToken(token);
    const userId = payload.sub;
    const { title, description } = await req.json();

    if (!title)
      return NextResponse.json({ error: "Title is required" }, { status: 400 });

    const [suggestion] = await db
      .select()
      .from(feedbackSuggestions)
      .where(eq(feedbackSuggestions.id, id))
      .limit(1);

    if (!suggestion)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (suggestion.userId !== userId)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Check if there are any upvotes from other users
    const [votes] = await db
      .select({ count: sql`count(*)` })
      .from(feedbackVotes)
      .where(
        and(
          eq(feedbackVotes.suggestionId, id),
          ne(feedbackVotes.userId, userId),
        ),
      );

    if (Number(votes.count) > 0) {
      return NextResponse.json(
        { error: "Cannot edit suggestion with existing upvotes from others" },
        { status: 400 },
      );
    }

    await db
      .update(feedbackSuggestions)
      .set({ title, description, updatedAt: new Date() })
      .where(eq(feedbackSuggestions.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error editing suggestion:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(req, { params }) {
  const { id } = await params;
  const token = req.cookies.get("session")?.value;
  if (!token)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const payload = await verifyToken(token);
    const userId = payload.sub;

    const [suggestion] = await db
      .select()
      .from(feedbackSuggestions)
      .where(eq(feedbackSuggestions.id, id))
      .limit(1);

    if (!suggestion)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (suggestion.userId !== userId)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Check if there are any upvotes from other users
    const [votes] = await db
      .select({ count: sql`count(*)` })
      .from(feedbackVotes)
      .where(
        and(
          eq(feedbackVotes.suggestionId, id),
          ne(feedbackVotes.userId, userId),
        ),
      );

    if (Number(votes.count) > 0) {
      return NextResponse.json(
        { error: "Cannot delete suggestion with existing upvotes from others" },
        { status: 400 },
      );
    }

    // Delete votes first (though there should only be the creator's vote if any, or none)
    await db.delete(feedbackVotes).where(eq(feedbackVotes.suggestionId, id));
    await db.delete(feedbackSuggestions).where(eq(feedbackSuggestions.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting suggestion:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
