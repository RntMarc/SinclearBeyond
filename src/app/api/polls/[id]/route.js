import crypto from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/db";
import { pollInvites, pollOptions, polls, pollVotes } from "@/lib/db/schema";
import { getPoll } from "@/lib/polls/utils";

export async function GET(_request, { params }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const poll = await getPoll(params.id, session.sub);
  if (!poll) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(poll);
}

export async function PATCH(request, { params }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const poll = await getPoll(params.id, session.sub);
  if (!poll || poll.creatorId !== session.sub) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { title, options, invites } = await request.json();
    const now = new Date();

    await db.transaction(async (tx) => {
      // Update poll title
      if (title) {
        await tx
          .update(polls)
          .set({ title, updatedAt: now })
          .where(eq(polls.id, params.id));
      }

      // Handle options update
      if (options) {
        const existingOptions = await tx
          .select()
          .from(pollOptions)
          .where(eq(pollOptions.pollId, params.id));

        const optionsToKeep = options.filter((o) => o.id);
        const optionsToAdd = options.filter((o) => !o.id);

        const keepIds = optionsToKeep.map((o) => o.id);
        const optionsToRemove = existingOptions.filter(
          (o) => !keepIds.includes(o.id),
        );

        // Check if kept options were modified (e.g., date change)
        for (const keptOption of optionsToKeep) {
          const original = existingOptions.find((o) => o.id === keptOption.id);
          if (
            original &&
            new Date(original.startAt).getTime() !==
              new Date(keptOption.startAt).getTime()
          ) {
            // Date changed -> Reset votes for this option
            await tx
              .delete(pollVotes)
              .where(eq(pollVotes.optionId, keptOption.id));

            await tx
              .update(pollOptions)
              .set({ startAt: new Date(keptOption.startAt) })
              .where(eq(pollOptions.id, keptOption.id));
          }
        }

        if (optionsToRemove.length > 0) {
          const removeIds = optionsToRemove.map((o) => o.id);
          await tx
            .delete(pollVotes)
            .where(inArray(pollVotes.optionId, removeIds));
          await tx
            .delete(pollOptions)
            .where(inArray(pollOptions.id, removeIds));
        }

        if (optionsToAdd.length > 0) {
          await tx.insert(pollOptions).values(
            optionsToAdd.map((o) => ({
              id: crypto.randomUUID(),
              pollId: params.id,
              startAt: new Date(o.startAt),
              createdAt: now,
            })),
          );
        }
      }

      // Handle invites update
      if (invites) {
        await tx.delete(pollInvites).where(eq(pollInvites.pollId, params.id));
        if (invites.length > 0) {
          await tx.insert(pollInvites).values(
            invites.map((i) => ({
              id: crypto.randomUUID(),
              pollId: params.id,
              userId: i.userId,
              isIndispensable: i.isIndispensable ? 1 : 0,
              createdAt: now,
            })),
          );
        }
      }
    });

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
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const poll = await getPoll(params.id, session.sub);
  if (!poll || poll.creatorId !== session.sub) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await db.transaction(async (tx) => {
      const options = await tx
        .select({ id: pollOptions.id })
        .from(pollOptions)
        .where(eq(pollOptions.pollId, params.id));

      const optionIds = options.map((o) => o.id);

      if (optionIds.length > 0) {
        await tx
          .delete(pollVotes)
          .where(inArray(pollVotes.optionId, optionIds));
      }

      await tx.delete(pollOptions).where(eq(pollOptions.pollId, params.id));
      await tx.delete(pollInvites).where(eq(pollInvites.pollId, params.id));
      await tx.delete(polls).where(eq(polls.id, params.id));
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete poll:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
