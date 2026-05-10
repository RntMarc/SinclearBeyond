import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/auth";
import { db } from "@/lib/db/db";
import { feedbackSuggestions, feedbackVotes } from "@/lib/db/schema";

export async function POST(req, { params }) {
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

    // Voting frozen for done, cancelled, rejected
    if (["done", "cancelled", "rejected"].includes(suggestion.status)) {
      return NextResponse.json(
        { error: "Voting is frozen for this suggestion" },
        { status: 400 },
      );
    }

    // Check if already upvoted
    const [existingVote] = await db
      .select()
      .from(feedbackVotes)
      .where(
        and(
          eq(feedbackVotes.suggestionId, id),
          eq(feedbackVotes.userId, userId),
        ),
      )
      .limit(1);

    if (existingVote) {
      // Already upvoted, remove it (toggle behavior)
      await db
        .delete(feedbackVotes)
        .where(
          and(
            eq(feedbackVotes.suggestionId, id),
            eq(feedbackVotes.userId, userId),
          ),
        );
      return NextResponse.json({ status: "removed" });
    }

    // Add vote
    await db.insert(feedbackVotes).values({
      id: crypto.randomUUID(),
      suggestionId: id,
      userId,
      createdAt: new Date(),
    });

    return NextResponse.json({ status: "added" });
  } catch (error) {
    console.error("Error toggling vote:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
