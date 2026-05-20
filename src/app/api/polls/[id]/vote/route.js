import crypto from "node:crypto";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/db";
import { pollInvites, pollOptions, polls, pollVotes } from "@/lib/db/schema";

export async function POST(request, { params }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { optionId, availability } = await request.json();

    if (!optionId || !availability) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Check if option belongs to a poll the user is invited to
    const [option] = await db
      .select()
      .from(pollOptions)
      .where(eq(pollOptions.id, optionId));

    if (!option) {
      return NextResponse.json({ error: "Option not found" }, { status: 404 });
    }

    const invites = await db
      .select()
      .from(pollInvites)
      .where(
        and(
          eq(pollInvites.pollId, option.pollId),
          eq(pollInvites.userId, session.sub),
        ),
      );

    const [poll] = await db
      .select()
      .from(polls)
      .where(eq(polls.id, option.pollId));

    if (invites.length === 0 && poll?.creatorId !== session.sub) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const now = new Date();

    const [existingVote] = await db
      .select()
      .from(pollVotes)
      .where(
        and(
          eq(pollVotes.optionId, optionId),
          eq(pollVotes.userId, session.sub),
        ),
      );

    if (existingVote) {
      await db
        .update(pollVotes)
        .set({ availability, updatedAt: now })
        .where(eq(pollVotes.id, existingVote.id));
    } else {
      await db.insert(pollVotes).values({
        id: crypto.randomUUID(),
        optionId,
        userId: session.sub,
        availability,
        updatedAt: now,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to vote:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
