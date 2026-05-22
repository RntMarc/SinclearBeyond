import { eq, sql } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import AppShell from "@/components/layout/Appshell";
import { InlineError } from "@/components/ui/InlineError";
import { getSessionWithSubs } from "@/lib/auth/sessionExtended";
import { db, safeQuery } from "@/lib/db/db";
import { mediaItems, mediaReviews, users } from "@/lib/db/schema";
import { getProfileData } from "@/lib/profile/profile";
import MusicDetailPageClient from "./MusicDetailPageClient";

export default async function MusicDetailPage({ params }) {
  const { id } = await params;
  const session = await getSessionWithSubs();

  if (!session) {
    redirect(`/login?callbackUrl=/kritik/musik/${id}`);
  }

  const profileData = await getProfileData(session);
  if (!profileData) redirect("/login");
  const { user } = profileData;

  const { data: musicResult, error: musicError } = await safeQuery(
    db
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
      .limit(1),
  );

  if (musicError) {
    return (
      <AppShell user={user} session={session}>
        <div className="p-6">
          <InlineError />
        </div>
      </AppShell>
    );
  }

  if (!musicResult || musicResult.length === 0) {
    notFound();
  }

  const music = musicResult[0];
  let subItemsError = false;

  if (music.type === "music") {
    const { albumTracks } = await import("@/lib/db/schema");
    if (music.format === "album") {
      const { data: tracks, error } = await safeQuery(
        db
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
          .groupBy(mediaItems.id, albumTracks.trackNumber)
          .orderBy(albumTracks.trackNumber),
      );

      music.tracks = tracks || [];
      subItemsError = error;
    } else if (music.format === "song") {
      const { data: albumsResult, error: songSelectError } = await safeQuery(
        db
          .select({
            id: mediaItems.id,
            title: mediaItems.title,
            image: mediaItems.image,
            format: mediaItems.format,
          })
          .from(albumTracks)
          .innerJoin(mediaItems, eq(albumTracks.albumId, mediaItems.id))
          .where(eq(albumTracks.songId, music.id)),
      );

      if (songSelectError) {
        subItemsError = true;
      } else {
        const albumsWithTracks = await Promise.all(
          (albumsResult || []).map(async (album) => {
            const { data: tracks, error } = await safeQuery(
              db
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
                .groupBy(mediaItems.id, albumTracks.trackNumber)
                .orderBy(albumTracks.trackNumber),
            );
            if (error) subItemsError = true;
            return { ...album, tracks: tracks || [] };
          }),
        );

        music.albums = albumsWithTracks;
      }
    }
  }

  const { data: reviews, error: reviewsError } = await safeQuery(
    db
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
      .orderBy(sql`${mediaReviews.createdAt} DESC`),
  );

  return (
    <AppShell user={user} session={session}>
      {(subItemsError || reviewsError) && (
        <div className="px-6 pt-6">
          <InlineError />
        </div>
      )}
      <MusicDetailPageClient
        music={music}
        reviews={reviews || []}
        userId={session.sub}
      />
    </AppShell>
  );
}
