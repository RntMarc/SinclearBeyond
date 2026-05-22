import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db, safeQuery } from "@/lib/db/db";
import {
  pollInvites,
  pollOptions,
  pollQuestions,
  polls,
} from "@/lib/db/schema";
import { getPolls } from "@/lib/polls/utils";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userPolls = await getPolls(session.sub);
  return NextResponse.json(userPolls);
}

export async function POST(request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const {
      type = "appointment",
      title,
      description,
      questions,
      invites,
    } = await request.json();

    if (!title || !questions || questions.length === 0) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const pollId = crypto.randomUUID();
    const now = new Date();

    const { error: txError } = await safeQuery(
      db.transaction(async (tx) => {
        await tx.insert(polls).values({
          id: pollId,
          type,
          title,
          description,
          creatorId: session.sub,
          createdAt: now,
          updatedAt: now,
        });

        for (let i = 0; i < questions.length; i++) {
          const q = questions[i];
          const questionId = crypto.randomUUID();

          await tx.insert(pollQuestions).values({
            id: questionId,
            pollId,
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

        if (invites && invites.length > 0) {
          await tx.insert(pollInvites).values(
            invites.map((invite) => ({
              id: crypto.randomUUID(),
              pollId,
              userId: invite.userId,
              isIndispensable: invite.isIndispensable ? 1 : 0,
              createdAt: now,
            })),
          );
        }
      }),
    );

    if (txError) throw new Error("Transaction failed");

    return NextResponse.json({ id: pollId });
  } catch (error) {
    console.error("Failed to create poll:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
