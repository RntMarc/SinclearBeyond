import crypto from "node:crypto";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db, safeQuery } from "@/lib/db/db";
import { pollOptions, pollQuestions, polls } from "@/lib/db/schema";
import { sendNotification } from "@/lib/notifications/service";

export async function POST(request, { params }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { dateValue } = await request.json();
    if (!dateValue) {
      return NextResponse.json({ error: "Missing dateValue" }, { status: 400 });
    }

    const now = new Date();
    if (new Date(dateValue) < now) {
      return NextResponse.json({ error: "Past date" }, { status: 400 });
    }

    const { data: pollData, error: pollError } = await safeQuery(
      db.select().from(polls).where(eq(polls.id, id)),
    );

    if (pollError || !pollData?.[0]) {
      return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    }
    const poll = pollData[0];

    if (!poll.allowCounterProposals && poll.creatorId !== session.sub) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (poll.finalizedOptionId) {
      return NextResponse.json(
        { error: "Poll already finalized" },
        { status: 400 },
      );
    }

    const { data: questionData, error: qError } = await safeQuery(
      db
        .select()
        .from(pollQuestions)
        .where(
          and(eq(pollQuestions.pollId, id), eq(pollQuestions.type, "date")),
        )
        .limit(1),
    );

    if (qError || !questionData?.[0]) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 },
      );
    }
    const questionId = questionData[0].id;

    // Check for duplicate date
    const { data: existingOptions } = await safeQuery(
      db
        .select()
        .from(pollOptions)
        .where(eq(pollOptions.questionId, questionId)),
    );

    const isDuplicate = existingOptions?.some(
      (opt) =>
        opt.dateValue &&
        new Date(opt.dateValue).getTime() === new Date(dateValue).getTime(),
    );

    if (isDuplicate) {
      return NextResponse.json({ error: "Duplicate date" }, { status: 400 });
    }

    const optionId = crypto.randomUUID();

    const { error: txError } = await safeQuery(
      db.transaction(async (tx) => {
        await tx.insert(pollOptions).values({
          id: optionId,
          questionId,
          dateValue: new Date(dateValue),
          order: 99, // Will be appended at the end
          createdAt: now,
        });

        await tx.update(polls).set({ updatedAt: now }).where(eq(polls.id, id));
      }),
    );

    if (txError) throw new Error("Transaction failed");

    // Notify creator if someone else adds a counter-proposal
    if (poll.creatorId !== session.sub) {
      await sendNotification({
        userIds: [poll.creatorId],
        type: "poll",
        entityId: id,
        title: "Gegenvorschlag eingegangen",
        body: `Ein neuer Terminvorschlag wurde für "${poll.title}" eingereicht.`,
        link: `/umfrage/${id}`,
        tag: `poll-counter-${id}`,
      });
    }

    return NextResponse.json({ success: true, optionId });
  } catch (error) {
    console.error("Failed to add counter-proposal:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
