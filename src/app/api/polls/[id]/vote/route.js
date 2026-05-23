import crypto from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db, safeQuery } from "@/lib/db/db";
import { pollInvites, pollQuestions, polls, pollVotes } from "@/lib/db/schema";

export async function POST(request, { params }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { answers } = await request.json();

    if (!answers || !Array.isArray(answers)) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const { data: pollsData, error: pollError } = await safeQuery(
      db.select().from(polls).where(eq(polls.id, id)),
    );

    if (pollError) throw pollError;
    const poll = pollsData?.[0];

    if (!poll) {
      return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    }

    const { data: invites, error: inviteError } = await safeQuery(
      db
        .select()
        .from(pollInvites)
        .where(
          and(eq(pollInvites.pollId, id), eq(pollInvites.userId, session.sub)),
        ),
    );

    if (inviteError) throw inviteError;

    if (invites.length === 0 && poll.creatorId !== session.sub) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const now = new Date();

    const { error: dbError } = await safeQuery(
      db.transaction(async (tx) => {
        // 1. Get all unique question IDs being answered
        const answeredQuestionIds = [
          ...new Set(answers.map((a) => a.questionId)),
        ];

        if (answeredQuestionIds.length > 0) {
          // 2. Clear all previous votes for these questions by this user
          await tx
            .delete(pollVotes)
            .where(
              and(
                inArray(pollVotes.questionId, answeredQuestionIds),
                eq(pollVotes.userId, session.sub),
              ),
            );
        }

        // 3. Insert new votes
        for (const answer of answers) {
          const { questionId, optionId, value, availability } = answer;

          // Verify question belongs to this poll
          const [question] = await tx
            .select()
            .from(pollQuestions)
            .where(
              and(
                eq(pollQuestions.id, questionId),
                eq(pollQuestions.pollId, id),
              ),
            );

          if (!question) continue;

          // Add new vote if it has content
          const hasContent =
            value !== undefined ||
            optionId !== undefined ||
            availability !== undefined;

          if (
            hasContent &&
            ((value !== null && value !== undefined) ||
              (optionId !== null && optionId !== undefined) ||
              (availability !== null && availability !== undefined))
          ) {
            await tx.insert(pollVotes).values({
              id: crypto.randomUUID(),
              questionId,
              optionId,
              userId: session.sub,
              value: value?.toString(),
              availability,
              updatedAt: now,
            });
          }
        }
      }),
    );

    if (dbError) throw dbError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to vote:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
