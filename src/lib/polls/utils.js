import { and, eq, inArray, or, sql } from "drizzle-orm";
import { db, safeQuery } from "@/lib/db/db";
import {
  pollInvites,
  pollOptions,
  pollQuestions,
  polls,
  pollVotes,
  users,
} from "@/lib/db/schema";

export async function getPolls(userId, includeArchived = false) {
  // Get polls created by the user or where the user is invited
  const { data: invitedRows, error: inviteErr } = await safeQuery(
    db
      .select({ pollId: pollInvites.pollId })
      .from(pollInvites)
      .where(eq(pollInvites.userId, userId)),
  );
  if (inviteErr) throw inviteErr;

  const invitedPollIds = (invitedRows || []).map((p) => p.pollId);

  const now = new Date();
  const appointmentArchiveThreshold = new Date(
    now.getTime() - 24 * 60 * 60 * 1000,
  ); // 1 day ago
  const surveyArchiveThreshold = new Date(
    now.getTime() - 7 * 24 * 60 * 60 * 1000,
  ); // 7 days ago

  const visibilityCondition = or(
    eq(polls.creatorId, userId),
    invitedPollIds.length > 0 ? inArray(polls.id, invitedPollIds) : sql`1=0`,
  );

  const isArchivedCondition = or(
    // Appointments finalized with an option
    and(
      eq(polls.type, "appointment"),
      sql`${polls.finalizedOptionId} IS NOT NULL`,
      sql`${polls.finalizedOptionId} != 'closed'`,
      sql`${pollOptions.dateValue} < ${appointmentArchiveThreshold}`,
    ),
    // Appointments closed without an option
    and(
      eq(polls.type, "appointment"),
      eq(polls.finalizedOptionId, "closed"),
      sql`${polls.updatedAt} < ${appointmentArchiveThreshold}`,
    ),
    // Surveys
    and(
      eq(polls.type, "survey"),
      sql`${polls.finalizedOptionId} IS NOT NULL`,
      sql`${polls.updatedAt} < ${surveyArchiveThreshold}`,
    ),
  );

  const archiveFilter = includeArchived
    ? isArchivedCondition
    : or(
        sql`${polls.finalizedOptionId} IS NULL`,
        and(
          eq(polls.type, "appointment"),
          sql`${polls.finalizedOptionId} IS NOT NULL`,
          or(
            and(
              sql`${polls.finalizedOptionId} != 'closed'`,
              sql`${pollOptions.dateValue} >= ${appointmentArchiveThreshold}`,
            ),
            and(
              eq(polls.finalizedOptionId, "closed"),
              sql`${polls.updatedAt} >= ${appointmentArchiveThreshold}`,
            ),
          ),
        ),
        and(
          eq(polls.type, "survey"),
          sql`${polls.finalizedOptionId} IS NOT NULL`,
          sql`${polls.updatedAt} >= ${surveyArchiveThreshold}`,
        ),
      );

  const { data: userPolls, error: pollErr } = await safeQuery(
    db
      .select({
        id: polls.id,
        type: polls.type,
        title: polls.title,
        description: polls.description,
        creatorId: polls.creatorId,
        finalizedOptionId: polls.finalizedOptionId,
        allowCounterProposals: polls.allowCounterProposals,
        createdAt: polls.createdAt,
        updatedAt: polls.updatedAt,
        creatorName: users.displayName,
        creatorImage: users.image,
      })
      .from(polls)
      .leftJoin(users, eq(polls.creatorId, users.id))
      .leftJoin(pollOptions, eq(polls.finalizedOptionId, pollOptions.id))
      .where(and(visibilityCondition, archiveFilter))
      .orderBy(sql`${polls.createdAt} DESC`),
  );
  if (pollErr) throw pollErr;

  const pollIds = (userPolls || []).map((p) => p.id);
  if (pollIds.length === 0) return [];

  const { data: allQuestions, error: qErr } = await safeQuery(
    db
      .select()
      .from(pollQuestions)
      .where(inArray(pollQuestions.pollId, pollIds))
      .orderBy(pollQuestions.order),
  );
  if (qErr) throw qErr;

  const questionIds = (allQuestions || []).map((q) => q.id);
  let allOptions = [];
  if (questionIds.length > 0) {
    const { data: optData, error: optErr } = await safeQuery(
      db
        .select()
        .from(pollOptions)
        .where(inArray(pollOptions.questionId, questionIds))
        .orderBy(pollOptions.dateValue, pollOptions.order),
    );
    if (optErr) throw optErr;
    allOptions = optData || [];
  }

  const enrichedPolls = (userPolls || []).map((poll) => {
    const questions = (allQuestions || []).filter((q) => q.pollId === poll.id);
    const qIds = questions.map((q) => q.id);
    const options = allOptions.filter((o) => qIds.includes(o.questionId));

    return {
      ...poll,
      questions,
      options,
    };
  });

  return enrichedPolls;
}

export function validatePollData(questions) {
  const now = new Date();
  for (const q of questions) {
    if (["single_choice", "multiple_choice", "date"].includes(q.type)) {
      const values = q.options.map((opt) =>
        q.type === "date" ? opt.dateValue : opt.label?.trim(),
      );

      // Check for duplicates
      if (values.some((val, idx) => values.indexOf(val) !== idx)) {
        return { valid: false, error: "Duplicate options" };
      }

      // Check for past dates
      if (q.type === "date") {
        if (
          q.options.some(
            (opt) => opt.dateValue && new Date(opt.dateValue) < now,
          )
        ) {
          return { valid: false, error: "Past date not allowed" };
        }
      }
    }
  }
  return { valid: true };
}

export async function getPoll(pollId, userId) {
  const { data: pollsData, error: pollErr } = await safeQuery(
    db
      .select({
        id: polls.id,
        type: polls.type,
        title: polls.title,
        description: polls.description,
        creatorId: polls.creatorId,
        finalizedOptionId: polls.finalizedOptionId,
        allowCounterProposals: polls.allowCounterProposals,
        createdAt: polls.createdAt,
        updatedAt: polls.updatedAt,
        creatorName: users.displayName,
        creatorImage: users.image,
      })
      .from(polls)
      .leftJoin(users, eq(polls.creatorId, users.id))
      .where(eq(polls.id, pollId)),
  );
  if (pollErr) throw pollErr;
  const poll = pollsData?.[0];

  if (!poll) return null;

  const { data: invites, error: inviteErr } = await safeQuery(
    db
      .select({
        id: pollInvites.id,
        userId: pollInvites.userId,
        isIndispensable: pollInvites.isIndispensable,
        displayName: users.displayName,
        image: users.image,
      })
      .from(pollInvites)
      .leftJoin(users, eq(pollInvites.userId, users.id))
      .where(eq(pollInvites.pollId, pollId)),
  );
  if (inviteErr) throw inviteErr;

  const isInvited = (invites || []).some((i) => i.userId === userId);
  const isCreator = poll.creatorId === userId;

  if (!isInvited && !isCreator) return null;

  const { data: questions, error: qErr } = await safeQuery(
    db
      .select()
      .from(pollQuestions)
      .where(eq(pollQuestions.pollId, pollId))
      .orderBy(pollQuestions.order),
  );
  if (qErr) throw qErr;

  const questionIds = (questions || []).map((q) => q.id);

  let options = [];
  if (questionIds.length > 0) {
    const { data, error } = await safeQuery(
      db
        .select()
        .from(pollOptions)
        .where(inArray(pollOptions.questionId, questionIds))
        .orderBy(pollOptions.dateValue, pollOptions.order),
    );
    if (error) throw error;
    options = data || [];
  }

  let votes = [];
  if (questionIds.length > 0) {
    const { data, error } = await safeQuery(
      db
        .select()
        .from(pollVotes)
        .where(inArray(pollVotes.questionId, questionIds)),
    );
    if (error) throw error;
    votes = data || [];
  }

  // Filter votes for surveys: Only creator sees all, users see only their own
  const filteredVotes =
    poll.type === "survey" && !isCreator
      ? (votes || []).filter((v) => v.userId === userId)
      : votes || [];

  return {
    ...poll,
    invites: invites || [],
    questions: questions || [],
    options,
    votes: filteredVotes,
    isCreator,
  };
}
