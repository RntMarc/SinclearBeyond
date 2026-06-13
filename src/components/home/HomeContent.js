import HomeClient from "@/components/home/HomeClient";
import { InlineError } from "@/components/ui/InlineError";
import { phpFetch } from "@/lib/api/phpClient";
import { getWhoMarkedMe } from "@/lib/profile/closeFriends";
import { getUnsplashPhotos } from "@/lib/photos/unsplash";
import { getBirthdays } from "@/lib/profile/birthdays";

export default async function HomeContent({ userId, isAdmin }) {
  const now = new Date();
  const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // 1. Fetch Upcoming Events (next 7 days)
  let standardEvents = [];
  let eventsError = false;
  const calResult = await phpFetch("/calendar/combined");
  if (calResult.ok) {
    const allItems = calResult.data?.data || [];
    standardEvents = allItems
      .filter((item) => item.source === "event")
      .filter((event) => {
        const start = new Date(event.startAt);
        return start >= now && start <= sevenDaysLater;
      })
      .sort((a, b) => new Date(a.startAt) - new Date(b.startAt));
  } else {
    eventsError = true;
  }

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

  // 4. Forum Posts (from all joined forums - single PHP call)
  let forumPosts = [];
  let joinedForumsError = false;
  let forumInternalError = false;
  const feedPostsResult = await phpFetch("/home/feed-posts?days=7");
  if (feedPostsResult.ok) {
    const allPosts = feedPostsResult.data?.data || [];
    // Group posts by forumId
    const postsByForum = {};
    for (const post of allPosts) {
      if (!postsByForum[post.forumId]) {
        postsByForum[post.forumId] = { forumId: post.forumId, posts: [] };
      }
      postsByForum[post.forumId].posts.push(post);
    }
    forumPosts = Object.values(postsByForum);
  } else {
    joinedForumsError = true;
    forumInternalError = true;
  }

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

  // 6. Latest Media Reviews (last 7 days - PHP)
  let latestMediaReviewsRows = [];
  let mediaReviewsError = false;
  const mediaResult = await phpFetch("/home/media-reviews?days=7");
  if (mediaResult.ok) {
    latestMediaReviewsRows = (mediaResult.data?.data || []).map((r) => ({
      review: {
        id: r.id,
        itemId: r.itemId,
        userId: r.userId,
        rating: r.rating,
        content: r.content,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      },
      item: {
        id: r.itemId,
        title: r.itemTitle,
        image: r.itemImage,
        type: r.itemType,
      },
      user: {
        id: r.userId,
        displayName: r.displayName,
        image: r.image,
      },
    }));
  } else {
    mediaReviewsError = true;
  }

  // 7. Latest Discover Reviews (last 7 days - PHP)
  let latestDiscoverReviewsRows = [];
  let discoverReviewsError = false;
  const discoverResult = await phpFetch("/home/discover-reviews?days=7");
  if (discoverResult.ok) {
    latestDiscoverReviewsRows = (discoverResult.data?.data || []).map((r) => ({
      review: {
        id: r.id,
        placeId: r.placeId,
        userId: r.userId,
        rating: r.rating,
        content: r.content,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      },
      place: {
        id: r.placeId,
        name: r.placeName,
      },
      user: {
        id: r.userId,
        displayName: r.displayName,
        image: r.image,
      },
    }));
  } else {
    discoverReviewsError = true;
  }

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

  // 8. Fetch Polls (PHP)
  let activePolls = [];
  let finalizedPolls = [];
  let pollInvitesError = false;
  let activePollsError = false;
  let finalizedPollsError = false;
  const pollsResult = await phpFetch("/home/polls");
  if (pollsResult.ok) {
    const pollsData = pollsResult.data?.data || {};
    activePolls = pollsData.active || [];
    finalizedPolls = (pollsData.finalized || []).map((row) => ({
      id: row.id,
      title: row.title,
      finalizedOptionId: row.finalizedOptionId,
      options: [{
        id: row.optionId,
        label: row.label,
        dateValue: row.dateValue,
        orderNum: row.orderNum,
        questionId: row.questionId,
      }],
    }));
  } else {
    pollInvitesError = true;
    activePollsError = true;
    finalizedPollsError = true;
  }

  const hasAnyError =
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
        latestMediaReviews={latestMediaReviewsRows}
        latestDiscoverReviews={latestDiscoverReviewsRows}
        activePolls={activePolls}
        finalizedPolls={finalizedPolls}
      />
    </div>
  );
}
