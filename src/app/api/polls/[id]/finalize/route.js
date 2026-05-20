import crypto from "node:crypto";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/db";
import {
  eventPermissions,
  eventRelations,
  events,
  pollInvites,
  pollOptions,
  polls,
} from "@/lib/db/schema";

export async function POST(request, { params }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { optionId } = await request.json();

    const [poll] = await db
      .select()
      .from(polls)
      .where(and(eq(polls.id, params.id), eq(polls.creatorId, session.sub)));

    if (!poll) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [option] = await db
      .select()
      .from(pollOptions)
      .where(
        and(eq(pollOptions.id, optionId), eq(pollOptions.pollId, params.id)),
      );

    if (!option) {
      return NextResponse.json({ error: "Option not found" }, { status: 404 });
    }

    const now = new Date();
    const eventId = crypto.randomUUID();

    await db.transaction(async (tx) => {
      // 1. Mark poll as finalized
      await tx
        .update(polls)
        .set({ finalizedOptionId: optionId, updatedAt: now })
        .where(eq(polls.id, params.id));

      // 2. Create Kalender-Event
      await tx.insert(events).values({
        id: eventId,
        title: poll.title,
        startAt: option.startAt,
        endAt: new Date(new Date(option.startAt).getTime() + 60 * 60 * 1000), // Default 1h
        allDay: 0,
        isPublic: 0,
        creatorId: session.sub,
        createdAt: now,
      });

      // 3. Add all participants to the event
      const invites = await tx
        .select()
        .from(pollInvites)
        .where(eq(pollInvites.pollId, params.id));

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
    });

    return NextResponse.json({ success: true, eventId });
  } catch (error) {
    console.error("Failed to finalize poll:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
