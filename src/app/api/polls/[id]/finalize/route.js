import crypto from "node:crypto";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db, safeQuery } from "@/lib/db/db";
import {
  eventPermissions,
  eventRelations,
  events,
  pollInvites,
  pollOptions,
  pollQuestions,
  polls,
} from "@/lib/db/schema";

export async function POST(request, { params }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { optionId, closeOnly } = await request.json();

    const { data: pollData, error: pollError } = await safeQuery(
      db
        .select()
        .from(polls)
        .where(and(eq(polls.id, id), eq(polls.creatorId, session.sub))),
    );

    if (pollError || !pollData?.[0]) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const poll = pollData[0];

    let option = null;
    if (optionId) {
      const { data: optionData, error: optionError } = await safeQuery(
        db
          .select()
          .from(pollOptions)
          .leftJoin(pollQuestions, eq(pollOptions.questionId, pollQuestions.id))
          .where(
            and(eq(pollOptions.id, optionId), eq(pollQuestions.pollId, id)),
          ),
      );

      if (optionError || !optionData?.[0]) {
        return NextResponse.json(
          { error: "Option not found" },
          { status: 404 },
        );
      }
      option = optionData[0];
    }

    const now = new Date();
    const eventId = crypto.randomUUID();

    const { error: txError } = await safeQuery(
      db.transaction(async (tx) => {
        // 1. Mark poll as finalized
        await tx
          .update(polls)
          .set({
            finalizedOptionId: optionId || "closed",
            updatedAt: now,
          })
          .where(eq(polls.id, id));

        // 2. Create Kalender-Event (only if appointment and option selected)
        if (poll.type === "appointment" && option && !closeOnly) {
          await tx.insert(events).values({
            id: eventId,
            title: poll.title,
            startAt: option.dateValue,
            endAt: new Date(
              new Date(option.dateValue).getTime() + 60 * 60 * 1000,
            ), // Default 1h
            allDay: 0,
            isPublic: 0,
            creatorId: session.sub,
            createdAt: now,
          });

          // 3. Add all participants to the event
          const invites = await tx
            .select()
            .from(pollInvites)
            .where(eq(pollInvites.pollId, id));

          const participantUserIds = [
            ...new Set([...invites.map((i) => i.userId), session.sub]),
          ];

          if (participantUserIds.length > 0) {
            await tx.insert(eventRelations).values(
              participantUserIds.map((uId) => ({
                id: crypto.randomUUID(),
                eventId,
                userId: uId,
                createdAt: now,
              })),
            );

            await tx.insert(eventPermissions).values(
              participantUserIds.map((uId) => ({
                id: crypto.randomUUID(),
                eventId,
                userId: uId,
                canView: 1,
                canEdit: uId === session.sub ? 1 : 0,
                createdAt: now,
              })),
            );
          }
        }
      }),
    );

    if (txError) throw new Error("Transaction failed");

    return NextResponse.json({ success: true, eventId });
  } catch (error) {
    console.error("Failed to finalize poll:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
