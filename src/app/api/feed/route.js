import crypto from "node:crypto";
import { and, eq, inArray, or } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/db";
import { closeFriends, feedPosts, users } from "@/lib/db/schema";

export async function GET(req) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const userId = session.sub;
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const onlyCloseFriends = searchParams.get("onlyCloseFriends") === "true";

  // 1. Get who marked me as close friend (to see their "close friend only" posts)
  const whoMarkedMeAsCloseFriend = await db
    .select({ userId: closeFriends.userId })
    .from(closeFriends)
    .where(eq(closeFriends.friendId, userId));
  const markedByMeAsCloseFriendIds = whoMarkedMeAsCloseFriend.map(
    (r) => r.userId,
  );

  // 2. Get who I marked as close friend (for the "only close friends" filter)
  const myCloseFriends = await db
    .select({ friendId: closeFriends.friendId })
    .from(closeFriends)
    .where(eq(closeFriends.userId, userId));
  const closeFriendIds = myCloseFriends.map((r) => r.friendId);

  // Conditions for visibility:
  // - Public (visibility = 1)
  // - Close Friends (visibility = 2) AND the author has me as a close friend
  // - Own posts
  const visibilityConditions = [
    eq(feedPosts.visibility, 1),
    eq(feedPosts.userId, userId),
  ];
  if (markedByMeAsCloseFriendIds.length > 0) {
    visibilityConditions.push(
      and(
        eq(feedPosts.visibility, 2),
        inArray(feedPosts.userId, markedByMeAsCloseFriendIds),
      ),
    );
  }

  const whereConditions = [or(...visibilityConditions)];

  if (category && category !== "all") {
    whereConditions.push(eq(feedPosts.category, category));
  }

  if (onlyCloseFriends) {
    if (closeFriendIds.length > 0) {
      whereConditions.push(inArray(feedPosts.userId, closeFriendIds));
    } else {
      // If filtering by close friends but I have none, return empty
      return NextResponse.json([]);
    }
  }

  const rows = await db
    .select({
      post: feedPosts,
      user: {
        id: users.id,
        displayName: users.displayName,
      },
    })
    .from(feedPosts)
    .innerJoin(users, eq(feedPosts.userId, users.id))
    .where(and(...whereConditions))
    .orderBy(feedPosts.createdAt); // We'll reverse it in frontend or here. Request said chronological, usually means newest last but "Social Media Feed" usually means newest first. Let's use desc.

  // Re-sorting desc for newest first if preferred for "Social Media Feed"
  const sortedRows = rows.sort((a, b) => b.post.createdAt - a.post.createdAt);

  const result = sortedRows.map((row) => ({
    ...row.post,
    user: row.user,
    canEdit: row.post.userId === userId,
  }));

  return NextResponse.json(result);
}

export async function POST(req) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const { category, content, visibility, ...details } = body;

  if (!category)
    return NextResponse.json({ error: "missing_category" }, { status: 400 });

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
    // Details
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
