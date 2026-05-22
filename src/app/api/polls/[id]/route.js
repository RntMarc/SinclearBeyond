import crypto from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db, safeQuery } from "@/lib/db/db";
import {
  pollInvites,
  pollOptions,
  pollQuestions,
  polls,
  pollVotes,
} from "@/lib/db/schema";
import { getPoll } from "@/lib/polls/utils";

export async function GET(_request, { params }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const poll = await getPoll(id, session.sub);
  if (!poll) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(poll);
}

export async function PATCH(request, { params }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const poll = await getPoll(id, session.sub);
  if (!poll || poll.creatorId !== session.sub) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { title, description, questions, invites } = await request.json();
    const now = new Date();

    const { error: dbError } = await safeQuery(
      db.transaction(async (tx) => {
        // Update poll metadata
        await tx
          .update(polls)
          .set({
            title: title ?? poll.title,
            description: description ?? poll.description,
            updatedAt: now,
          })
          .where(eq(polls.id, id));

        if (questions) {
          const existingQuestions = await tx
            .select({ id: pollQuestions.id })
            .from(pollQuestions)
            .where(eq(pollQuestions.pollId, id));

          const qIds = existingQuestions.map((q) => q.id);
          if (qIds.length > 0) {
            await tx
              .delete(pollVotes)
              .where(inArray(pollVotes.questionId, qIds));
            await tx
              .delete(pollOptions)
              .where(inArray(pollOptions.questionId, qIds));
            await tx.delete(pollQuestions).where(eq(pollQuestions.pollId, id));
          }

          for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            const questionId = crypto.randomUUID();

            await tx.insert(pollQuestions).values({
              id: questionId,
              pollId: id,
              title: q.title,
              type: q.type,
              order: i,
              createdAt: now,
            });

            if (q.options && q.options.length > 0) {
              await tx.insert(pollOptions).values(
                q.options.map((opt, optIdx) => ({
                  id: crypto.randomUUID(),
                  questionId,
                  label: opt.label,
                  dateValue: opt.dateValue ? new Date(opt.dateValue) : null,
                  order: optIdx,
                  createdAt: now,
                })),
              );
            }
          }
        }

        // Handle invites update
        if (invites) {
          await tx.delete(pollInvites).where(eq(pollInvites.pollId, id));
          if (invites.length > 0) {
            await tx.insert(pollInvites).values(
              invites.map((i) => ({
                id: crypto.randomUUID(),
                pollId: id,
                userId: i.userId,
                isIndispensable: i.isIndispensable ? 1 : 0,
                createdAt: now,
              })),
            );
          }
        }
      }),
    );

    if (dbError) throw dbError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update poll:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request, { params }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const poll = await getPoll(id, session.sub);
  if (!poll || poll.creatorId !== session.sub) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { error: dbError } = await safeQuery(
      db.transaction(async (tx) => {
        const questions = await tx
          .select({ id: pollQuestions.id })
          .from(pollQuestions)
          .where(eq(pollQuestions.pollId, id));

        const qIds = questions.map((q) => q.id);

        if (qIds.length > 0) {
          await tx.delete(pollVotes).where(inArray(pollVotes.questionId, qIds));
          await tx
            .delete(pollOptions)
            .where(inArray(pollOptions.questionId, qIds));
        }

        await tx.delete(pollQuestions).where(eq(pollQuestions.pollId, id));
        await tx.delete(pollInvites).where(eq(pollInvites.pollId, id));
        await tx.delete(polls).where(eq(polls.id, id));
      }),
    );

    if (dbError) throw dbError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete poll:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
