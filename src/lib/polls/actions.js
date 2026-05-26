"use server";

import { and, eq, inArray, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { db, safeQuery } from "@/lib/db/db";
import { pollInvites, polls, readStatuses } from "@/lib/db/schema";

export async function getUnreadPollsCount() {
  const session = await getSession();
  if (!session) return 0;
  const userId = session.sub;

  const { data: invitedRows } = await safeQuery(
    db
      .select({ pollId: pollInvites.pollId })
      .from(pollInvites)
      .where(eq(pollInvites.userId, userId)),
  );
  const invitedPollIds = (invitedRows || []).map((p) => p.pollId);

  const { data: userPolls } = await safeQuery(
    db
      .select({ id: polls.id })
      .from(polls)
      .where(
        or(
          eq(polls.creatorId, userId),
          invitedPollIds.length > 0
            ? inArray(polls.id, invitedPollIds)
            : sql`1=0`,
        ),
      ),
  );

  const pollIds = (userPolls || []).map((p) => p.id);
  if (pollIds.length === 0) return 0;

  const { data: readEntries } = await safeQuery(
    db
      .select({ entityId: readStatuses.entityId })
      .from(readStatuses)
      .where(
        and(
          eq(readStatuses.userId, userId),
          eq(readStatuses.entityType, "poll"),
          inArray(readStatuses.entityId, pollIds),
        ),
      ),
  );

  const readIds = new Set((readEntries || []).map((r) => r.entityId));
  const unreadCount = pollIds.filter((id) => !readIds.has(id)).length;

  return unreadCount;
}

export async function markAllPollsAsRead() {
  const session = await getSession();
  if (!session) return { ok: false };
  const userId = session.sub;

  const { data: invitedRows } = await safeQuery(
    db
      .select({ pollId: pollInvites.pollId })
      .from(pollInvites)
      .where(eq(pollInvites.userId, userId)),
  );
  const invitedPollIds = (invitedRows || []).map((p) => p.pollId);

  const { data: userPolls } = await safeQuery(
    db
      .select({ id: polls.id })
      .from(polls)
      .where(
        or(
          eq(polls.creatorId, userId),
          invitedPollIds.length > 0
            ? inArray(polls.id, invitedPollIds)
            : sql`1=0`,
        ),
      ),
  );

  const pollIds = (userPolls || []).map((p) => p.id);
  if (pollIds.length === 0) return { ok: true };

  const { data: alreadyRead } = await safeQuery(
    db
      .select({ entityId: readStatuses.entityId })
      .from(readStatuses)
      .where(
        and(
          eq(readStatuses.userId, userId),
          eq(readStatuses.entityType, "poll"),
          inArray(readStatuses.entityId, pollIds),
        ),
      ),
  );

  const alreadyReadIds = new Set((alreadyRead || []).map((r) => r.entityId));
  const unreadIds = pollIds.filter((id) => !alreadyReadIds.has(id));

  if (unreadIds.length > 0) {
    const values = unreadIds.map((id) => ({
      id: crypto.randomUUID(),
      userId,
      entityType: "poll",
      entityId: id,
      createdAt: new Date(),
    }));
    await safeQuery(db.insert(readStatuses).values(values));
  }

  revalidatePath("/umfrage");
  revalidatePath("/", "layout");
  return { ok: true };
}
