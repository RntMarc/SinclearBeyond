import { and, desc, eq, gte, inArray, lte, or, sql } from "drizzle-orm";
import HomeClient from "@/components/home/HomeClient";
import { InlineError } from "@/components/ui/InlineError";
import { db, safeQuery } from "@/lib/db/db";
import {
  discoverPlaces,
  discoverReviews,
  eventPermissions,
  events,
  feedPosts,
  feedPostVotes,
  forumMembers,
  forums,
  mediaItems,
  mediaReviews,
  pollInvites,
  pollOptions,
  polls,
  users,
} from "@/lib/db/schema";
import { phpFetch } from "@/lib/api/phpClient";
import { getWhoMarkedMe } from "@/lib/profile/closeFriends";
import { getUnsplashPhotos } from "@/lib/photos/unsplash";
import { getBirthdays } from "@/lib/profile/birthdays";

export default async function HomeContent({ userId, isAdmin }) {
  const now = new Date();
  const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // 1. Fetch Upcoming Events (next 7 days)
  const { data: viewPermRows, error: viewPermError } = await safeQuery(
    db
      .select({ eventId: eventPermissions.eventId })
      .from(eventPermissions)
      .where(
        and(
          eq(eventPermissions.userId, userId),
          eq(eventPermissions.canView, 1),
        ),
      ),
  );

  const permEventIds = viewPermRows?.map((r) => r.eventId) || [];
  const standardEventConditions = [
    eq(events.isPublic, 1),
    eq(events.creatorId, userId),
  ];
  if (permEventIds.length > 0)
    standardEventConditions.push(inArray(events.id, permEventIds));

  const { data: standardEvents, error: eventsError } = await safeQuery(
    db
      .select()
      .from(events)
      .where(
        and(
          or(...standardEventConditions),
          gte(events.startAt, now),
          lte(events.startAt, sevenDaysLater),
        ),
      )
      .orderBy(events.startAt),
  );

  // 2. Fetch Upcoming Trips (next 7 days OR currently active)
  let trips = [];
  let tripsError = false;
  const tripsResult = await phpFetch("/travel/my-trips");
  if (tripsResult.ok) {
    const allTrips = tripsResult.data?.data || [];
    trips = allTrips.filter((trip) => {
      const start = new Date(trip.start);
      const end = new Date(trip.end);
      return (start >= now && start <= sevenDaysLater) || (start <= now && end >= now);
    });
  } else {
    tripsError = true;
  }

  // 3. Upcoming Birthdays (next 7 days)
  const allBirthdays = await getBirthdays();
  const upcomingBirthdays =
    allBirthdays?.filter((b) => b.daysUntil >= 0 && b.daysUntil <= 7) || [];

  // 4. Forum Posts (from joined forums)
  const { data: joinedForums, error: joinedForumsError } = await safeQuery(
    db
      .select({ forum: forums })
      .from(forumMembers)
      .innerJoin(forums, eq(forumMembers.forumId, forums.id))
      .where(eq(forumMembers.userId, userId)),
  );

  const whoMarkedMe = await getWhoMarkedMe();
  const usersWhoMarkedMeIds = whoMarkedMe.map((r) => r.userId);

  let forumInternalError = false;
  const forumsWithPosts = await Promise.all(
    (joinedForums || []).map(async (row) => {

      const postVisibilityConditions = [
        eq(feedPosts.visibility, 1),
        eq(feedPosts.userId, userId),
      ];
      if (usersWhoMarkedMeIds.length > 0) {
        postVisibilityConditions.push(
          and(
            eq(feedPosts.visibility, 2),
            inArray(feedPosts.userId, usersWhoMarkedMeIds),
          ),
        );
      }

      const { data: postsRows, error: pError } = await safeQuery(
        db
          .select({
            post: feedPosts,
            user: {
              id: users.id,
              displayName: users.displayName,
              image: users.image,
            },
            voteCount: sql`(SELECT count(*) FROM ${feedPostVotes} WHERE postId = ${feedPosts.id})`,
            hasVoted: sql`(SELECT count(*) FROM ${feedPostVotes} WHERE postId = ${feedPosts.id} AND userId = ${userId})`,
          })
          .from(feedPosts)
          .innerJoin(users, eq(feedPosts.userId, users.id))
          .where(
            and(
              eq(feedPosts.forumId, row.forum.id),
              or(...postVisibilityConditions),
              gte(feedPosts.createdAt, sevenDaysAgo),
            ),
          )
          .orderBy(desc(feedPosts.createdAt))
          .limit(5),
      );
      if (pError) forumInternalError = true;

      return {
        ...row.forum,
        posts:
          postsRows?.map((r) => ({
            ...r.post,
            user: r.user,
            voteCount: Number(r.voteCount),
            hasVoted: Number(r.hasVoted) > 0,
            canEdit: r.post.userId === userId,
          })) || [],
      };
    }),
  );

  const forumPosts = forumsWithPosts.filter((f) => f.posts.length > 0);

  // 5. Latest Photos (last 7 days)
  const allPhotos = await getUnsplashPhotos({ page: 1, perPage: 20 });
  const latestPhotos =
    allPhotos
      ?.filter((p) => {
        const photoDate = new Date(p.createdAt).getTime();
        const isRecent = photoDate >= sevenDaysAgo.getTime();
        return isRecent;
      })
      .slice(0, 10) || [];

  // 6. Latest Media Reviews (last 7 days)
  const { data: latestMediaReviewsRows, error: mediaReviewsError } =
    await safeQuery(
      db
        .select({
          review: mediaReviews,
          item: {
            id: mediaItems.id,
            title: mediaItems.title,
            image: mediaItems.image,
            type: mediaItems.type,
          },
          user: {
            id: users.id,
            displayName: users.displayName,
            image: users.image,
          },
        })
        .from(mediaReviews)
        .innerJoin(mediaItems, eq(mediaReviews.itemId, mediaItems.id))
        .innerJoin(users, eq(mediaReviews.userId, users.id))
        .where(gte(mediaReviews.createdAt, sevenDaysAgo))
        .orderBy(desc(mediaReviews.createdAt))
        .limit(5),
    );

  // 7. Latest Discover Reviews (last 7 days)
  const { data: latestDiscoverReviewsRows, error: discoverReviewsError } =
    await safeQuery(
      db
        .select({
          review: discoverReviews,
          place: {
            id: discoverPlaces.id,
            name: discoverPlaces.name,
          },
          user: {
            id: users.id,
            displayName: users.displayName,
            image: users.image,
          },
        })
        .from(discoverReviews)
        .innerJoin(
          discoverPlaces,
          eq(discoverReviews.placeId, discoverPlaces.id),
        )
        .innerJoin(users, eq(discoverReviews.userId, users.id))
        .where(gte(discoverReviews.createdAt, sevenDaysAgo))
        .orderBy(desc(discoverReviews.createdAt))
        .limit(5),
    );

  let upcomingTravelEvents = [];
  let travelEventsError = false;
  const eventsResult = await phpFetch("/travel/my-events");
  if (eventsResult.ok) {
    const allEvents = eventsResult.data?.data || [];
    upcomingTravelEvents = allEvents
      .filter((event) => {
        const start = new Date(event.start);
        const end = new Date(event.end);
        return (start >= now && start <= sevenDaysLater) || (start <= now && end >= now);
      })
      .sort((a, b) => new Date(a.start) - new Date(b.start));
  } else {
    travelEventsError = true;
  }

  const combinedEvents = [
    ...(standardEvents || []).map((e) => ({ ...e, type: "event" })),
    ...upcomingTravelEvents.map((e) => ({
      ...e,
      type: "travelEvent",
      title: e.name,
      startAt: e.start,
      endAt: e.end,
    })),
  ].sort((a, b) => new Date(a.startAt) - new Date(b.startAt));

  // 8. Fetch Polls
  const { data: invitedPollIdsRows, error: pollInvitesError } = await safeQuery(
    db
      .select({ pollId: pollInvites.pollId })
      .from(pollInvites)
      .where(eq(pollInvites.userId, userId)),
  );
  const invitedPollIds = invitedPollIdsRows?.map((r) => r.pollId) || [];

  const { data: activePolls, error: activePollsError } = await safeQuery(
    db
      .select({
        id: polls.id,
        title: polls.title,
        creatorId: polls.creatorId,
        finalizedOptionId: polls.finalizedOptionId,
        creatorName: users.displayName,
      })
      .from(polls)
      .leftJoin(users, eq(polls.creatorId, users.id))
      .where(
        and(
          or(
            eq(polls.creatorId, userId),
            invitedPollIds.length > 0
              ? inArray(polls.id, invitedPollIds)
              : sql`1=0`,
          ),
          sql`${polls.finalizedOptionId} IS NULL`,
        ),
      ),
  );

  const { data: finalizedPollsRows, error: finalizedPollsError } =
    await safeQuery(
      db
        .select({
          poll: {
            id: polls.id,
            title: polls.title,
            finalizedOptionId: polls.finalizedOptionId,
          },
          option: pollOptions,
        })
        .from(polls)
        .innerJoin(pollOptions, eq(polls.finalizedOptionId, pollOptions.id))
        .where(
          and(
            or(
              eq(polls.creatorId, userId),
              invitedPollIds.length > 0
                ? inArray(polls.id, invitedPollIds)
                : sql`1=0`,
            ),
            sql`${polls.finalizedOptionId} IS NOT NULL`,
            gte(polls.updatedAt, sevenDaysAgo),
            gte(pollOptions.dateValue, now),
          ),
        ),
    );

  const finalizedPolls =
    finalizedPollsRows?.map((row) => ({
      ...row.poll,
      options: [row.option],
    })) || [];

  const hasAnyError =
    viewPermError ||
    eventsError ||
    tripsError ||
    mediaReviewsError ||
    discoverReviewsError ||
    travelEventsError ||
    pollInvitesError ||
    activePollsError ||
    finalizedPollsError ||
    joinedForumsError ||
    forumInternalError;

  return (
    <div className="space-y-6">
      {hasAnyError && <InlineError />}
      <HomeClient
        upcomingEvents={combinedEvents}
        upcomingTrips={trips}
        upcomingBirthdays={upcomingBirthdays}
        forumPosts={forumPosts}
        latestPhotos={latestPhotos}
        latestMediaReviews={latestMediaReviewsRows || []}
        latestDiscoverReviews={latestDiscoverReviewsRows || []}
        activePolls={activePolls || []}
        finalizedPolls={finalizedPolls}
      />
    </div>
  );
}
