import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth/session";
import { phpFetch } from "@/lib/api/phpClient";

export async function PATCH(req, { params }) {
  const t = await getTranslations("Common");
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: t("unauthorized") }, { status: 401 });

  const { id } = await params;

  try {
    const body = await req.json();
    const { category, content, visibility, ...details } = body;

    // Validate music URLs if category is music
    const currentCategory = category || "text";
    if (currentCategory === "music") {
      const tFeed = await getTranslations("Feed.form");
      const artist = details.artist?.trim();
      const title = details.title?.trim();
      if (!artist || !title) {
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
    }

    const updateData = {
      updatedAt: new Date().toISOString(),
    };
    if (category !== undefined) updateData.category = category;
    if (content !== undefined) updateData.content = content?.trim() || null;
    if (visibility !== undefined) updateData.visibility = visibility;
    if (details.artist !== undefined) updateData.artist = details.artist?.trim() || null;
    if (details.title !== undefined) updateData.title = details.title?.trim() || null;
    if (details.spotifyUrl !== undefined) updateData.spotifyUrl = details.spotifyUrl?.trim() || null;
    if (details.youtubeMusicUrl !== undefined) updateData.youtubeMusicUrl = details.youtubeMusicUrl?.trim() || null;
    if (details.youtubeUrl !== undefined) updateData.youtubeUrl = details.youtubeUrl?.trim() || null;
    if (details.soundcloudUrl !== undefined) updateData.soundcloudUrl = details.soundcloudUrl?.trim() || null;
    if (details.videoUrl !== undefined) updateData.videoUrl = details.videoUrl?.trim() || null;
    if (details.videoPlatform !== undefined) updateData.videoPlatform = details.videoPlatform?.trim() || null;
    if (details.newsTitle !== undefined) updateData.newsTitle = details.newsTitle?.trim() || null;
    if (details.newsSite !== undefined) updateData.newsSite = details.newsSite?.trim() || null;
    if (details.newsUrl !== undefined) updateData.newsUrl = details.newsUrl?.trim() || null;
    if (details.otherTitle !== undefined) updateData.otherTitle = details.otherTitle?.trim() || null;
    if (details.otherUrl !== undefined) updateData.otherUrl = details.otherUrl?.trim() || null;

    const result = await phpFetch(`/posts/${id}`, {
      method: "PATCH",
      body: updateData,
    });

    if (!result.ok) {
      if (result.status === 404) {
        return NextResponse.json({ error: t("notFound") }, { status: 404 });
      }
      if (result.status === 403) {
        return NextResponse.json({ error: t("forbidden") }, { status: 403 });
      }
      return NextResponse.json({ error: t("saveError") }, { status: 500 });
    }

    return NextResponse.json(result.data?.data || { id });
  } catch (error) {
    console.error("[API/Feed/ID] PATCH Error:", error);
    return NextResponse.json({ error: t("saveError") }, { status: 500 });
  }
}

export async function DELETE(_req, { params }) {
  const t = await getTranslations("Common");
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: t("unauthorized") }, { status: 401 });

  const { id } = await params;

  try {
    const result = await phpFetch(`/posts/${id}`, { method: "DELETE" });

    if (!result.ok) {
      if (result.status === 404) {
        return NextResponse.json({ error: t("notFound") }, { status: 404 });
      }
      if (result.status === 403) {
        return NextResponse.json({ error: t("forbidden") }, { status: 403 });
      }
      return NextResponse.json({ error: t("deleteError") }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API/Feed/ID] DELETE Error:", error);
    return NextResponse.json({ error: t("deleteError") }, { status: 500 });
  }
}
