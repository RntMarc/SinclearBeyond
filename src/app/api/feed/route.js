import crypto from "node:crypto";
import { and, desc, eq, inArray, or } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/db";
import { closeFriends, feedPosts, users } from "@/lib/db/schema";

export async function GET(req) {
  const t = await getTranslations("Common");
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: t("unauthorized") }, { status: 401 });

  const userId = session.sub;
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const onlyCloseFriends = searchParams.get("onlyCloseFriends") === "true";

  // 1. Who has marked ME as their close friend
  //    → these users' visibility=2 posts are visible to me
  const usersWhoMarkedMeAsCloseFriend = await db
    .select({ userId: closeFriends.userId })
    .from(closeFriends)
    .where(eq(closeFriends.friendId, userId));
  const usersWhoMarkedMeIds = usersWhoMarkedMeAsCloseFriend.map(
    (r) => r.userId,
  );

  // 2. Who I have marked as my close friend
  //    → used for the onlyCloseFriends UI filter
  const myCloseFriends = await db
    .select({ friendId: closeFriends.friendId })
    .from(closeFriends)
    .where(eq(closeFriends.userId, userId));
  const myCloseFriendIds = myCloseFriends.map((r) => r.friendId);
  const myCloseFriendIdsSet = new Set(myCloseFriendIds);

  // Visibility rules:
  // - Public (visibility = 1): always visible
  // - Close Friends (visibility = 2): only if the creator has ME in their close friends
  // - Own posts: always visible
  const visibilityConditions = [
    eq(feedPosts.visibility, 1),
    eq(feedPosts.userId, userId),
  ];
  if (usersWhoMarkedMeIds.length > 0) {
    visibilityConditions.push(
      and(
        eq(feedPosts.visibility, 2),
        inArray(feedPosts.userId, usersWhoMarkedMeIds),
      ),
    );
  }

  const whereConditions = [or(...visibilityConditions)];

  if (category && category !== "all") {
    whereConditions.push(eq(feedPosts.category, category));
  }

  // UI filter: only posts from users I have marked as close friend
  // (visibility rules still apply — e.g. a visibility=2 post from someone
  //  I marked as close friend is only visible if they also marked me)
  if (onlyCloseFriends) {
    if (myCloseFriendIds.length > 0) {
      whereConditions.push(inArray(feedPosts.userId, myCloseFriendIds));
    } else {
      return NextResponse.json([]);
    }
  }

  const rows = await db
    .select({
      post: feedPosts,
      user: {
        id: users.id,
        displayName: users.displayName,
        image: users.image,
      },
    })
    .from(feedPosts)
    .innerJoin(users, eq(feedPosts.userId, users.id))
    .where(and(...whereConditions))
    .orderBy(desc(feedPosts.createdAt));

  const result = rows.map((row) => ({
    ...row.post,
    user: {
      ...row.user,
      isCloseFriend: myCloseFriendIdsSet.has(row.user.id),
    },
    canEdit: row.post.userId === userId,
  }));

  return NextResponse.json(result);
}

export async function POST(req) {
  const t = await getTranslations("Common");
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: t("unauthorized") }, { status: 401 });

  const body = await req.json();
  const { category, content, visibility, ...details } = body;

  if (!category)
    return NextResponse.json({ error: t("missingFields") }, { status: 400 });

  const id = crypto.randomUUID();
  const now = new Date();

  await db.insert(feedPosts).values({
    id,
    userId: session.sub,
    category,
    content: content?.trim() || null,
    visibility: visibility || 1,
    createdAt: now,
    updatedAt: now,
    artist: details.artist?.trim() || null,
    title: details.title?.trim() || null,
    spotifyUrl: details.spotifyUrl?.trim() || null,
    youtubeMusicUrl: details.youtubeMusicUrl?.trim() || null,
    soundcloudUrl: details.soundcloudUrl?.trim() || null,
    videoUrl: details.videoUrl?.trim() || null,
    videoPlatform: details.videoPlatform?.trim() || null,
    newsTitle: details.newsTitle?.trim() || null,
    newsSite: details.newsSite?.trim() || null,
    newsUrl: details.newsUrl?.trim() || null,
    otherTitle: details.otherTitle?.trim() || null,
    otherUrl: details.otherUrl?.trim() || null,
  });

  const [row] = await db
    .select()
    .from(feedPosts)
    .where(eq(feedPosts.id, id))
    .limit(1);

  return NextResponse.json(row, { status: 201 });
}
