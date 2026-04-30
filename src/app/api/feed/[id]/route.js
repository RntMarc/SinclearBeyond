import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/db";
import { feedPosts } from "@/lib/db/schema";

export async function PATCH(req, { params }) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { category, content, visibility, ...details } = body;

  const [existing] = await db
    .select()
    .from(feedPosts)
    .where(eq(feedPosts.id, id))
    .limit(1);

  if (!existing)
    return NextResponse.json({ error: "not_found" }, { status: 404 });

  if (existing.userId !== session.sub)
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

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
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;

  const [existing] = await db
    .select()
    .from(feedPosts)
    .where(eq(feedPosts.id, id))
    .limit(1);

  if (!existing)
    return NextResponse.json({ error: "not_found" }, { status: 404 });

  if (existing.userId !== session.sub)
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  await db.delete(feedPosts).where(eq(feedPosts.id, id));

  return NextResponse.json({ success: true });
}
