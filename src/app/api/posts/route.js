import crypto from "node:crypto";
import { and, desc, eq, inArray, or } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth/session";
import { db, safeQuery } from "@/lib/db/db";
import { feedPosts, forumMembers, users } from "@/lib/db/schema";
import { getWhoMarkedMe, getWhoIMarked } from "@/lib/profile/closeFriends";
import { sendNotification } from "@/lib/notifications/service";

export async function GET(req) {
  const t = await getTranslations("Common");
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: t("unauthorized") }, { status: 401 });

  const userId = session.sub;
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const onlyCloseFriends = searchParams.get("onlyCloseFriends") === "true";

  try {
    // 1. Who has marked ME as their close friend
    //    → these users' visibility=2 posts are visible to me
    const whoMarkedMe = await getWhoMarkedMe();
    const usersWhoMarkedMeIds = whoMarkedMe.map((r) => r.userId);

    // 2. Who I have marked as my close friend
    //    → used for the onlyCloseFriends UI filter
    const myFriends = await getWhoIMarked();
    const myCloseFriendIds = myFriends.map((r) => r.friendId);
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
    if (onlyCloseFriends) {
      if (myCloseFriendIds.length > 0) {
        whereConditions.push(inArray(feedPosts.userId, myCloseFriendIds));
      } else {
        return NextResponse.json([]);
      }
    }

    const { data: rows, error: rowsErr } = await safeQuery(
      db
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
        .orderBy(desc(feedPosts.createdAt)),
    );

    if (rowsErr) throw rowsErr;

    const result = (rows || []).map((row) => ({
      ...row.post,
      user: {
        ...row.user,
        isCloseFriend: myCloseFriendIdsSet.has(row.user.id),
      },
      canEdit: row.post.userId === userId,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("[API/Feed] GET Error:", error);
    return NextResponse.json({ error: t("loadError") }, { status: 500 });
  }
}

export async function POST(req) {
  const t = await getTranslations("Common");
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: t("unauthorized") }, { status: 401 });

  try {
    const body = await req.json();
    const { category, content, visibility, forumId, ...details } = body;

    if (!category || !forumId)
      return NextResponse.json({ error: t("missingFields") }, { status: 400 });

    // Server-side validation
    const tFeed = await getTranslations("Feed.form");
    if (category === "text") {
      if (!content?.trim()) {
        return NextResponse.json(
          { error: tFeed("errors.text") },
          { status: 400 },
        );
      }
    } else if (category === "music") {
      if (!details.artist || !details.title) {
        return NextResponse.json(
          { error: tFeed("errors.music") },
          { status: 400 },
        );
      }
      if (
        !details.spotifyUrl &&
        !details.youtubeMusicUrl &&
        !details.youtubeUrl &&
        !details.soundcloudUrl
      ) {
        return NextResponse.json(
          { error: tFeed("errors.musicLink") },
          { status: 400 },
        );
      }

      // URL Validations
      if (
        details.spotifyUrl &&
        !details.spotifyUrl.match(
          /^(https?:\/\/)?(open\.spotify\.com\/|spotify:)(track|album|playlist|artist).+$/,
        )
      ) {
        return NextResponse.json(
          { error: tFeed("errors.invalidUrl") },
          { status: 400 },
        );
      }
      if (
        details.youtubeMusicUrl &&
        !details.youtubeMusicUrl.match(
          /^(https?:\/\/)?(music\.youtube\.com\/)(watch\?v=|playlist\?list=).+$/,
        )
      ) {
        return NextResponse.json(
          { error: tFeed("errors.invalidUrl") },
          { status: 400 },
        );
      }
      if (
        details.youtubeUrl &&
        !details.youtubeUrl.match(
          /^(https?:\/\/)?(www\.|m\.)?(youtube\.com\/watch\?v=|youtu\.be\/).+$/,
        )
      ) {
        return NextResponse.json(
          { error: tFeed("errors.invalidUrl") },
          { status: 400 },
        );
      }
      if (
        details.soundcloudUrl &&
        !details.soundcloudUrl.match(/^(https?:\/\/)?(soundcloud\.com\/).+$/)
      ) {
        return NextResponse.json(
          { error: tFeed("errors.invalidUrl") },
          { status: 400 },
        );
      }
    }

    const id = crypto.randomUUID();
    const now = new Date();

    const { error: insertError } = await safeQuery(
      db.insert(feedPosts).values({
        id,
        userId: session.sub,
        forumId,
        category,
        content: content?.trim() || null,
        visibility: visibility || 1,
        createdAt: now,
        updatedAt: now,
        artist: details.artist?.trim() || null,
        title: details.title?.trim() || null,
        spotifyUrl: details.spotifyUrl?.trim() || null,
        youtubeMusicUrl: details.youtubeMusicUrl?.trim() || null,
        youtubeUrl: details.youtubeUrl?.trim() || null,
        soundcloudUrl: details.soundcloudUrl?.trim() || null,
        videoUrl: details.videoUrl?.trim() || null,
        videoPlatform: details.videoPlatform?.trim() || null,
        newsTitle: details.newsTitle?.trim() || null,
        newsSite: details.newsSite?.trim() || null,
        newsUrl: details.newsUrl?.trim() || null,
        otherTitle: details.otherTitle?.trim() || null,
        otherUrl: details.otherUrl?.trim() || null,
      }),
    );

    if (insertError) throw insertError;

    const { data: rows, error: rowErr } = await safeQuery(
      db.select().from(feedPosts).where(eq(feedPosts.id, id)).limit(1),
    );

    if (rowErr) throw rowErr;

    // Create notifications for forum members
    try {
      const { data: members } = await safeQuery(
        db
          .select({ userId: forumMembers.userId })
          .from(forumMembers)
          .where(eq(forumMembers.forumId, forumId)),
      );

      if (members && members.length > 0) {
        const targetUserIds = members
          .filter((m) => m.userId !== session.sub)
          .map((m) => m.userId);

        if (targetUserIds.length > 0) {
          await sendNotification({
            userIds: targetUserIds,
            type: "forum",
            entityId: id,
            title: "Neuer Forumsbeitrag",
            body: "Ein neuer Beitrag wurde im Forum erstellt",
            link: `/forum/${forumId}`,
            tag: `forum-${id}`,
          });
        }
      }
    } catch (notifyError) {
      console.error("[API/Feed] Notification Error:", notifyError);
      // We don't want to fail the post creation if notifications fail
    }

    return NextResponse.json(rows?.[0], { status: 201 });
  } catch (error) {
    console.error("[API/Feed] POST Error:", error);
    return NextResponse.json({ error: t("saveError") }, { status: 500 });
  }
}
