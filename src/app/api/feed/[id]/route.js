import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/db";
import { feedPosts } from "@/lib/db/schema";

export async function PATCH(req, { params }) {
  const t = await getTranslations("Common");
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: t("unauthorized") }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { category, content, visibility, ...details } = body;

  const [existing] = await db
    .select()
    .from(feedPosts)
    .where(eq(feedPosts.id, id))
    .limit(1);

  if (!existing)
    return NextResponse.json({ error: t("notFound") }, { status: 404 });

  if (existing.userId !== session.sub)
    return NextResponse.json({ error: t("forbidden") }, { status: 403 });

  // Server-side validation
  const currentCategory = category || existing.category;
  if (currentCategory === "music") {
    const tFeed = await getTranslations("Feed.form");
    const artist =
      details.artist !== undefined ? details.artist?.trim() : existing.artist;
    const title =
      details.title !== undefined ? details.title?.trim() : existing.title;
    const spotifyUrl =
      details.spotifyUrl !== undefined
        ? details.spotifyUrl?.trim()
        : existing.spotifyUrl;
    const youtubeMusicUrl =
      details.youtubeMusicUrl !== undefined
        ? details.youtubeMusicUrl?.trim()
        : existing.youtubeMusicUrl;
    const youtubeUrl =
      details.youtubeUrl !== undefined
        ? details.youtubeUrl?.trim()
        : existing.youtubeUrl;
    const soundcloudUrl =
      details.soundcloudUrl !== undefined
        ? details.soundcloudUrl?.trim()
        : existing.soundcloudUrl;

    if (!artist || !title) {
      return NextResponse.json(
        { error: tFeed("errors.music") },
        { status: 400 },
      );
    }
    if (!spotifyUrl && !youtubeMusicUrl && !youtubeUrl && !soundcloudUrl) {
      return NextResponse.json(
        { error: tFeed("errors.musicLink") },
        { status: 400 },
      );
    }

    // URL Validations
    if (
      spotifyUrl &&
      !spotifyUrl.match(
        /^(https?:\/\/)?(open\.spotify\.com\/|spotify:)(track|album|playlist|artist).+$/,
      )
    ) {
      return NextResponse.json(
        { error: tFeed("errors.invalidUrl") },
        { status: 400 },
      );
    }
    if (
      youtubeMusicUrl &&
      !youtubeMusicUrl.match(
        /^(https?:\/\/)?(music\.youtube\.com\/)(watch\?v=|playlist\?list=).+$/,
      )
    ) {
      return NextResponse.json(
        { error: tFeed("errors.invalidUrl") },
        { status: 400 },
      );
    }
    if (
      youtubeUrl &&
      !youtubeUrl.match(
        /^(https?:\/\/)?(www\.|m\.)?(youtube\.com\/watch\?v=|youtu\.be\/).+$/,
      )
    ) {
      return NextResponse.json(
        { error: tFeed("errors.invalidUrl") },
        { status: 400 },
      );
    }
    if (
      soundcloudUrl &&
      !soundcloudUrl.match(/^(https?:\/\/)?(soundcloud\.com\/).+$/)
    ) {
      return NextResponse.json(
        { error: tFeed("errors.invalidUrl") },
        { status: 400 },
      );
    }
  }

  const now = new Date();

  await db
    .update(feedPosts)
    .set({
      category: category || existing.category,
      content:
        content !== undefined ? content?.trim() || null : existing.content,
      visibility: visibility !== undefined ? visibility : existing.visibility,
      updatedAt: now,
      artist:
        details.artist !== undefined
          ? details.artist?.trim() || null
          : existing.artist,
      title:
        details.title !== undefined
          ? details.title?.trim() || null
          : existing.title,
      spotifyUrl:
        details.spotifyUrl !== undefined
          ? details.spotifyUrl?.trim() || null
          : existing.spotifyUrl,
      youtubeMusicUrl:
        details.youtubeMusicUrl !== undefined
          ? details.youtubeMusicUrl?.trim() || null
          : existing.youtubeMusicUrl,
      youtubeUrl:
        details.youtubeUrl !== undefined
          ? details.youtubeUrl?.trim() || null
          : existing.youtubeUrl,
      soundcloudUrl:
        details.soundcloudUrl !== undefined
          ? details.soundcloudUrl?.trim() || null
          : existing.soundcloudUrl,
      videoUrl:
        details.videoUrl !== undefined
          ? details.videoUrl?.trim() || null
          : existing.videoUrl,
      videoPlatform:
        details.videoPlatform !== undefined
          ? details.videoPlatform?.trim() || null
          : existing.videoPlatform,
      newsTitle:
        details.newsTitle !== undefined
          ? details.newsTitle?.trim() || null
          : existing.newsTitle,
      newsSite:
        details.newsSite !== undefined
          ? details.newsSite?.trim() || null
          : existing.newsSite,
      newsUrl:
        details.newsUrl !== undefined
          ? details.newsUrl?.trim() || null
          : existing.newsUrl,
      otherTitle:
        details.otherTitle !== undefined
          ? details.otherTitle?.trim() || null
          : existing.otherTitle,
      otherUrl:
        details.otherUrl !== undefined
          ? details.otherUrl?.trim() || null
          : existing.otherUrl,
    })
    .where(eq(feedPosts.id, id));

  const [updated] = await db
    .select()
    .from(feedPosts)
    .where(eq(feedPosts.id, id))
    .limit(1);

  return NextResponse.json(updated);
}

export async function DELETE(_req, { params }) {
  const t = await getTranslations("Common");
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: t("unauthorized") }, { status: 401 });

  const { id } = await params;

  const [existing] = await db
    .select()
    .from(feedPosts)
    .where(eq(feedPosts.id, id))
    .limit(1);

  if (!existing)
    return NextResponse.json({ error: t("notFound") }, { status: 404 });

  if (existing.userId !== session.sub)
    return NextResponse.json({ error: t("forbidden") }, { status: 403 });

  await db.delete(feedPosts).where(eq(feedPosts.id, id));

  return NextResponse.json({ success: true });
}
