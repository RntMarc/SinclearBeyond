import { and, eq, ne, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/auth";
import { db, safeQuery } from "@/lib/db/db";
import { feedbackSuggestions, feedbackVotes, users } from "@/lib/db/schema";

export async function PATCH(req, { params }) {
  const { id } = await params;
  const token = req.cookies.get("session")?.value;
  if (!token)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const payload = await verifyToken(token);
    const userId = payload.sub;

    const { data: usersData, error: userFetchErr } = await safeQuery(
      db.select().from(users).where(eq(users.id, userId)).limit(1),
    );
    if (userFetchErr) throw userFetchErr;
    const user = usersData?.[0];

    const body = await req.json();
    const { title, description, status } = body;

    const { data: suggestions, error: suggestionFetchErr } = await safeQuery(
      db
        .select()
        .from(feedbackSuggestions)
        .where(eq(feedbackSuggestions.id, id))
        .limit(1),
    );
    if (suggestionFetchErr) throw suggestionFetchErr;
    const suggestion = suggestions?.[0];

    if (!suggestion)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Admin can update status
    if (user?.isAdmin && status && status !== suggestion.status) {
      const { error: updateErr } = await safeQuery(
        db
          .update(feedbackSuggestions)
          .set({ status, updatedAt: new Date() })
          .where(eq(feedbackSuggestions.id, id)),
      );
      if (updateErr) throw updateErr;

      return NextResponse.json({ success: true });
    }

    if (suggestion.userId !== userId)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    if (!title)
      return NextResponse.json({ error: "Title is required" }, { status: 400 });

    // Check if there are any upvotes from other users
    const { data: votesData, error: votesErr } = await safeQuery(
      db
        .select({ count: sql`count(*)` })
        .from(feedbackVotes)
        .where(
          and(
            eq(feedbackVotes.suggestionId, id),
            ne(feedbackVotes.userId, userId),
          ),
        ),
    );
    if (votesErr) throw votesErr;
    const votes = votesData?.[0];

    if (votes && Number(votes.count) > 0) {
      return NextResponse.json(
        { error: "Cannot edit suggestion with existing upvotes from others" },
        { status: 400 },
      );
    }

    const { error: finalUpdateErr } = await safeQuery(
      db
        .update(feedbackSuggestions)
        .set({ title, description, updatedAt: new Date() })
        .where(eq(feedbackSuggestions.id, id)),
    );
    if (finalUpdateErr) throw finalUpdateErr;

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

    const { data: suggestions, error: suggestErr } = await safeQuery(
      db
        .select()
        .from(feedbackSuggestions)
        .where(eq(feedbackSuggestions.id, id))
        .limit(1),
    );
    if (suggestErr) throw suggestErr;
    const suggestion = suggestions?.[0];

    if (!suggestion)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (suggestion.userId !== userId)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Check if there are any upvotes from other users
    const { data: votesData, error: votesErr } = await safeQuery(
      db
        .select({ count: sql`count(*)` })
        .from(feedbackVotes)
        .where(
          and(
            eq(feedbackVotes.suggestionId, id),
            ne(feedbackVotes.userId, userId),
          ),
        ),
    );
    if (votesErr) throw votesErr;
    const votes = votesData?.[0];

    if (votes && Number(votes.count) > 0) {
      return NextResponse.json(
        { error: "Cannot delete suggestion with existing upvotes from others" },
        { status: 400 },
      );
    }

    // Delete votes first (though there should only be the creator's vote if any, or none)
    const { error: delVotesErr } = await safeQuery(
      db.delete(feedbackVotes).where(eq(feedbackVotes.suggestionId, id)),
    );
    if (delVotesErr) throw delVotesErr;

    const { error: delSuggestErr } = await safeQuery(
      db.delete(feedbackSuggestions).where(eq(feedbackSuggestions.id, id)),
    );
    if (delSuggestErr) throw delSuggestErr;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting suggestion:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
