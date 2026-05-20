import { eq, inArray, or, sql } from "drizzle-orm";
import { db } from "@/lib/db/db";
import {
  pollInvites,
  pollOptions,
  polls,
  pollVotes,
  users,
} from "@/lib/db/schema";

export async function getPolls(userId) {
  // Get polls created by the user or where the user is invited
  const invitedPollIdsRows = await db
    .select({ pollId: pollInvites.pollId })
    .from(pollInvites)
    .where(eq(pollInvites.userId, userId));

  const invitedPollIds = invitedPollIdsRows.map((p) => p.pollId);

  const userPolls = await db
    .select({
      id: polls.id,
      title: polls.title,
      creatorId: polls.creatorId,
      finalizedOptionId: polls.finalizedOptionId,
      createdAt: polls.createdAt,
      updatedAt: polls.updatedAt,
      creatorName: users.displayName,
    })
    .from(polls)
    .leftJoin(users, eq(polls.creatorId, users.id))
    .where(
      or(
        eq(polls.creatorId, userId),
        invitedPollIds.length > 0
          ? inArray(polls.id, invitedPollIds)
          : sql`1=0`,
      ),
    )
    .orderBy(sql`${polls.createdAt} DESC`);

  // Enrich with options and finalize status
  const enrichedPolls = await Promise.all(
    userPolls.map(async (poll) => {
      const options = await db
        .select()
        .from(pollOptions)
        .where(eq(pollOptions.pollId, poll.id))
        .orderBy(pollOptions.startAt);

      return {
        ...poll,
        options,
      };
    }),
  );

  return enrichedPolls;
}

export async function getPoll(pollId, userId) {
  const [poll] = await db
    .select({
      id: polls.id,
      title: polls.title,
      creatorId: polls.creatorId,
      finalizedOptionId: polls.finalizedOptionId,
      createdAt: polls.createdAt,
      updatedAt: polls.updatedAt,
      creatorName: users.displayName,
    })
    .from(polls)
    .leftJoin(users, eq(polls.creatorId, users.id))
    .where(eq(polls.id, pollId));

  if (!poll) return null;

  const invites = await db
    .select({
      id: pollInvites.id,
      userId: pollInvites.userId,
      isIndispensable: pollInvites.isIndispensable,
      displayName: users.displayName,
      image: users.image,
    })
    .from(pollInvites)
    .leftJoin(users, eq(pollInvites.userId, users.id))
    .where(eq(pollInvites.pollId, pollId));

  const isInvited = invites.some((i) => i.userId === userId);
  const isCreator = poll.creatorId === userId;

  if (!isInvited && !isCreator) return null;

  const options = await db
    .select()
    .from(pollOptions)
    .where(eq(pollOptions.pollId, pollId))
    .orderBy(pollOptions.startAt);

  const votes =
    options.length > 0
      ? await db
          .select()
          .from(pollVotes)
          .where(
            inArray(
              pollVotes.optionId,
              options.map((o) => o.id),
            ),
          )
      : [];

  return {
    ...poll,
    invites,
    options,
    votes,
    isCreator,
  };
}
