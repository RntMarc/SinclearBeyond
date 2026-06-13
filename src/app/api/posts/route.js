import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth/session";
import { phpFetch } from "@/lib/api/phpClient";
import { sendNotification } from "@/lib/notifications/service";

export async function GET(req) {
  const t = await getTranslations("Common");
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: t("unauthorized") }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const onlyCloseFriends = searchParams.get("onlyCloseFriends") === "true";

  try {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (onlyCloseFriends) params.set("onlyCloseFriends", "true");

    const result = await phpFetch(`/home/feed-posts-list?${params.toString()}`);
    if (!result.ok) {
      return NextResponse.json({ error: t("loadError") }, { status: 500 });
    }
    return NextResponse.json(result.data?.data || []);
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

    // Use generic CRUD to create the post
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const createResult = await phpFetch("/posts", {
      method: "POST",
      body: {
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
      },
    });

    if (!createResult.ok) {
      return NextResponse.json({ error: t("saveError") }, { status: 500 });
    }

    // Create notifications for forum members
    try {
      const membersResult = await phpFetch(`/forum-members?forumId=${forumId}`);
      const members = membersResult.ok ? (membersResult.data?.data || []) : [];

      if (members.length > 0) {
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
    }

    return NextResponse.json(createResult.data?.data || { id }, { status: 201 });
  } catch (error) {
    console.error("[API/Feed] POST Error:", error);
    return NextResponse.json({ error: t("saveError") }, { status: 500 });
  }
}
