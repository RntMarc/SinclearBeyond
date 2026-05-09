import { and, desc, eq, gte, inArray, lte, or } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import HomeClient from "@/components/home/HomeClient";
import AppShell from "@/components/layout/Appshell";
import { getSessionWithSubs } from "@/lib/auth/sessionExtended";
import { db } from "@/lib/db/db";
import {
  closeFriends,
  eventPermissions,
  events,
  feedPosts,
  travelEvents,
  travelRelations,
  travelTrips,
  users,
} from "@/lib/db/schema";
import { getUnsplashPhotos } from "@/lib/photos/unsplash";
import { getBirthdays } from "@/lib/profile/birthdays";

export default async function HomePage() {
  const t = await getTranslations("Home");
  const session = await getSessionWithSubs();
  if (!session) redirect("/login");

  const userId = session.sub;

  const [user] = await db
    .select({
      displayName: users.displayName,
      email: users.email,
      image: users.image,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const now = new Date();
  const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // 1. Fetch Upcoming Events (next 7 days)
  const viewPermRows = await db
    .select({ eventId: eventPermissions.eventId })
    .from(eventPermissions)
    .where(
      and(eq(eventPermissions.userId, userId), eq(eventPermissions.canView, 1)),
    );
  const permEventIds = viewPermRows.map((r) => r.eventId);
  const standardEventConditions = [
    eq(events.isPublic, 1),
    eq(events.creatorId, userId),
  ];
  if (permEventIds.length > 0)
    standardEventConditions.push(inArray(events.id, permEventIds));

  const standardEvents = await db
    .select()
    .from(events)
    .where(
      and(
        or(...standardEventConditions),
        gte(events.startAt, now),
        lte(events.startAt, sevenDaysLater),
      ),
    )
    .orderBy(events.startAt);

  // 2. Fetch Upcoming Trips (next 7 days)
  const userTripRelations = await db
    .select({ tripId: travelRelations.tripId })
    .from(travelRelations)
    .where(eq(travelRelations.userId, userId));
  const participantTripIds = userTripRelations.map((r) => r.tripId);

  let trips = [];
  if (session.isAdmin) {
    trips = await db
      .select()
      .from(travelTrips)
      .where(
        and(
          gte(travelTrips.start, now),
          lte(travelTrips.start, sevenDaysLater),
        ),
      )
      .orderBy(travelTrips.start);
  } else if (participantTripIds.length > 0) {
    trips = await db
      .select()
      .from(travelTrips)
      .where(
        and(
          inArray(travelTrips.id, participantTripIds),
          gte(travelTrips.start, now),
          lte(travelTrips.start, sevenDaysLater),
        ),
      )
      .orderBy(travelTrips.start);
  }

  // 3. Upcoming Birthdays (next 7 days)
  const allBirthdays = await getBirthdays();
  const upcomingBirthdays =
    allBirthdays?.filter((b) => b.daysUntil >= 0 && b.daysUntil <= 7) || [];

  // 4. Latest Posts (last 7 days)
  const usersWhoMarkedMeAsCloseFriend = await db
    .select({ userId: closeFriends.userId })
    .from(closeFriends)
    .where(eq(closeFriends.friendId, userId));
  const usersWhoMarkedMeIds = usersWhoMarkedMeAsCloseFriend.map(
    (r) => r.userId,
  );

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

  const latestPostsRows = await db
    .select({
      post: feedPosts,
      user: {
        id: users.id,
        displayName: users.displayName,
      },
    })
    .from(feedPosts)
    .innerJoin(users, eq(feedPosts.userId, users.id))
    .where(
      and(
        or(...postVisibilityConditions),
        gte(feedPosts.createdAt, sevenDaysAgo),
      ),
    )
    .orderBy(desc(feedPosts.createdAt))
    .limit(10);

  const latestPosts = latestPostsRows.map((row) => ({
    ...row.post,
    user: row.user,
    canEdit: row.post.userId === userId,
  }));

  // 5. Latest Photos (last 7 days - simplified, getUnsplashPhotos already handles visibility and merged/sorted)
  // We'll wrap the Unsplash fetch in a revalidate cache if possible, or just use the lib function.
  // Note: Unsplash API query might not support "since 7 days ago" easily, so we filter the result.
  const allPhotos = await getUnsplashPhotos({ page: 1, perPage: 20 });
  const latestPhotos =
    allPhotos
      ?.filter((p) => p.createdAt >= sevenDaysAgo.getTime())
      .slice(0, 10) || [];

  // Combine Events, Trips, TravelEvents if necessary?
  // User asked for "Events", "Trips", "Birthdays", "Posts", "Photos".
  // Let's also include travelEvents in the events section if they fall in the range.
  let upcomingTravelEvents = [];
  const visibleTripIds = trips.map((t) => t.id);
  if (visibleTripIds.length > 0) {
    upcomingTravelEvents = await db
      .select()
      .from(travelEvents)
      .where(
        and(
          inArray(travelEvents.tripId, visibleTripIds),
          gte(travelEvents.start, now),
          lte(travelEvents.start, sevenDaysLater),
        ),
      )
      .orderBy(travelEvents.start);
  }

  const combinedEvents = [
    ...standardEvents.map((e) => ({ ...e, type: "event" })),
    ...upcomingTravelEvents.map((e) => ({
      ...e,
      type: "travelEvent",
      title: e.name,
      startAt: e.start,
      endAt: e.end,
    })),
  ].sort((a, b) => new Date(a.startAt) - new Date(b.startAt));

  const userSubs = await db
    .select({ id: subscriptionRelations.id })
    .from(subscriptionRelations)
    .where(
      and(
        eq(subscriptionRelations.userId, userId),
        eq(subscriptionRelations.isUser, 1),
      ),
    )
    .limit(1);

  return (
    <AppShell
      user={{ ...user, hasSubscriptions: userSubs.length > 0 }}
      session={session}
    >
      <div className="flex flex-col min-h-full bg-background">
        <header className="px-6 py-8 md:px-10 md:py-12 bg-card border-b border-border shrink-0">
          <div className="max-w-5xl mx-auto">
            <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">
              {t("subtitle")}
            </p>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">
              {t("welcome", { name: user?.displayName ?? session.email })}
            </h1>
            <p className="text-muted-foreground mt-2">{t("description")}</p>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-10">
          <div className="max-w-5xl mx-auto">
            <HomeClient
              upcomingEvents={combinedEvents}
              upcomingTrips={trips}
              upcomingBirthdays={upcomingBirthdays}
              latestPosts={latestPosts}
              latestPhotos={latestPhotos}
            />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
