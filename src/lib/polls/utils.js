import { eq, inArray, or, sql } from "drizzle-orm";
import { db } from "@/lib/db/db";
import {
  pollInvites,
  pollOptions,
  pollQuestions,
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
      type: polls.type,
      title: polls.title,
      description: polls.description,
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

  // Enrich with questions and options to determine status/relevance
  const enrichedPolls = await Promise.all(
    userPolls.map(async (poll) => {
      const questions = await db
        .select()
        .from(pollQuestions)
        .where(eq(pollQuestions.pollId, poll.id))
        .orderBy(pollQuestions.order);

      const questionIds = questions.map((q) => q.id);

      const options =
        questionIds.length > 0
          ? await db
              .select()
              .from(pollOptions)
              .where(inArray(pollOptions.questionId, questionIds))
              .orderBy(pollOptions.order)
          : [];

      return {
        ...poll,
        questions,
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
      type: polls.type,
      title: polls.title,
      description: polls.description,
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

  const questions = await db
    .select()
    .from(pollQuestions)
    .where(eq(pollQuestions.pollId, pollId))
    .orderBy(pollQuestions.order);

  const questionIds = questions.map((q) => q.id);

  const options =
    questionIds.length > 0
      ? await db
          .select()
          .from(pollOptions)
          .where(inArray(pollOptions.questionId, questionIds))
          .orderBy(pollOptions.order)
      : [];

  const votes =
    questionIds.length > 0
      ? await db
          .select()
          .from(pollVotes)
          .where(inArray(pollVotes.questionId, questionIds))
      : [];

  // Filter votes for surveys: Only creator sees all, users see only their own
  const filteredVotes =
    poll.type === "survey" && !isCreator
      ? votes.filter((v) => v.userId === userId)
      : votes;

  return {
    ...poll,
    invites,
    questions,
    options,
    votes: filteredVotes,
    isCreator,
  };
}
