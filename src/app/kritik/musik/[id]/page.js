import { eq, sql } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import AppShell from "@/components/layout/Appshell";
import { getSessionWithSubs } from "@/lib/auth/sessionExtended";
import { db } from "@/lib/db/db";
import { mediaItems, mediaReviews, users } from "@/lib/db/schema";
import { getProfileData } from "@/lib/profile/profile";
import MusicDetailPageClient from "./MusicDetailPageClient";

export default async function MusicDetailPage({ params }) {
  const { id } = await params;
  const session = await getSessionWithSubs();

  if (!session) {
    redirect(`/login?callbackUrl=/kritik/musik/${id}`);
  }

  const data = await getProfileData(session);
  if (!data) redirect("/login");
  const { user } = data;

  const musicResult = await db
    .select({
      id: mediaItems.id,
      title: mediaItems.title,
      description: mediaItems.description,
      image: mediaItems.image,
      type: mediaItems.type,
      format: mediaItems.format,
      releaseDate: mediaItems.releaseDate,
      avgRating: sql`AVG(${mediaReviews.rating})`,
      reviewCount: sql`COUNT(${mediaReviews.id})`,
    })
    .from(mediaItems)
    .leftJoin(mediaReviews, eq(mediaItems.id, mediaReviews.itemId))
    .where(eq(mediaItems.id, id))
    .groupBy(mediaItems.id)
    .limit(1);

  if (musicResult.length === 0) {
    notFound();
  }

  const music = musicResult[0];

  if (music.type === "music") {
    const { albumTracks } = await import("@/lib/db/schema");
    if (music.format === "album") {
      const tracks = await db
        .select({
          id: mediaItems.id,
          title: mediaItems.title,
          format: mediaItems.format,
          trackNumber: albumTracks.trackNumber,
          avgRating: sql`AVG(${mediaReviews.rating})`,
          reviewCount: sql`COUNT(${mediaReviews.id})`,
        })
        .from(albumTracks)
        .innerJoin(mediaItems, eq(albumTracks.songId, mediaItems.id))
        .leftJoin(mediaReviews, eq(mediaItems.id, mediaReviews.itemId))
        .where(eq(albumTracks.albumId, music.id))
        .groupBy(mediaItems.id)
        .orderBy(albumTracks.trackNumber);

      music.tracks = tracks;
    } else if (music.format === "song") {
      const albumsResult = await db
        .select({
          id: mediaItems.id,
          title: mediaItems.title,
          image: mediaItems.image,
          format: mediaItems.format,
        })
        .from(albumTracks)
        .innerJoin(mediaItems, eq(albumTracks.albumId, mediaItems.id))
        .where(eq(albumTracks.songId, music.id));

      const albumsWithTracks = await Promise.all(
        albumsResult.map(async (album) => {
          const tracks = await db
            .select({
              id: mediaItems.id,
              title: mediaItems.title,
              format: mediaItems.format,
              trackNumber: albumTracks.trackNumber,
              avgRating: sql`AVG(${mediaReviews.rating})`,
              reviewCount: sql`COUNT(${mediaReviews.id})`,
            })
            .from(albumTracks)
            .innerJoin(mediaItems, eq(albumTracks.songId, mediaItems.id))
            .leftJoin(mediaReviews, eq(mediaItems.id, mediaReviews.itemId))
            .where(eq(albumTracks.albumId, album.id))
            .groupBy(mediaItems.id)
            .orderBy(albumTracks.trackNumber);
          return { ...album, tracks };
        }),
      );

      music.albums = albumsWithTracks;
    }
  }

  const reviews = await db
    .select({
      id: mediaReviews.id,
      rating: mediaReviews.rating,
      comment: mediaReviews.comment,
      platform: mediaReviews.platform,
      createdAt: mediaReviews.createdAt,
      user: {
        id: users.id,
        displayName: users.displayName,
        image: users.image,
      },
    })
    .from(mediaReviews)
    .innerJoin(users, eq(mediaReviews.userId, users.id))
    .where(eq(mediaReviews.itemId, id))
    .orderBy(sql`${mediaReviews.createdAt} DESC`);

  return (
    <AppShell user={user} session={session}>
      <MusicDetailPageClient
        music={music}
        reviews={reviews}
        userId={session.sub}
      />
    </AppShell>
  );
}
