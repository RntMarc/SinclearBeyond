"use server";
import { and, eq, inArray, or } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/db";
import { closeFriends, socialInfo, users } from "@/lib/db/schema";
import { fetchWithTimeout } from "@/lib/utils";

const UNSPLASH_API_KEY = process.env.UNSPLASH_API_KEY;

export async function getUnsplashPhotos({ page = 1, perPage = 20 } = {}) {
  const session = await getSession();
  if (!session?.sub) return [];

  const currentUserId = session.sub;

  // 1. Get all users who have an Unsplash handle and appropriate visibility
  // To do this efficiently, we first find who has me as a close friend
  const whoHasMeAsCloseFriend = await db
    .select({ userId: closeFriends.userId })
    .from(closeFriends)
    .where(eq(closeFriends.friendId, currentUserId));

  const closeFriendIds = whoHasMeAsCloseFriend.map((f) => f.userId);

  // Users I can see:
  // - Visibility = 1 (All)
  // - Visibility = 2 AND userId in closeFriendIds
  // - userId = currentUserId (Myself)

  const visibleSocialInfos = await db
    .select({
      unsplashHandle: socialInfo.unsplashHandle,
      userId: socialInfo.userId,
      displayName: users.displayName,
    })
    .from(socialInfo)
    .innerJoin(users, eq(socialInfo.userId, users.id))
    .where(
      and(
        or(
          eq(socialInfo.unsplashVisibility, 1),
          and(
            eq(socialInfo.unsplashVisibility, 2),
            closeFriendIds.length > 0
              ? inArray(socialInfo.userId, closeFriendIds)
              : eq(socialInfo.userId, "none"),
          ),
          eq(socialInfo.userId, currentUserId),
        ),
      ),
    );

  const handles = visibleSocialInfos
    .filter((s) => s.unsplashHandle)
    .map((s) => ({
      handle: s.unsplashHandle,
      displayName: s.displayName,
      userId: s.userId,
    }));

  console.log("[Unsplash] handles:", handles);

  if (handles.length === 0) {
    console.log("[Unsplash] No handles with Unsplash found or visible.");
    return [];
  }

  // 2. Fetch photos for each handle
  // Note: Unsplash API doesn't have a "get photos from multiple users" endpoint in one go.
  // We have to fetch for each user. To respect rate limits and order by "newest",
  // we'll fetch a few from each and then merge/sort if possible,
  // but since we want "Endless Scrolling", we'll just distribute the perPage across users.

  // For simplicity and performance, we'll fetch perPage for each user and merge them.
  // Then sort by createdAt.

  const allPhotos = await Promise.all(
    handles.map(async ({ handle, displayName }) => {
      try {
        const res = await fetchWithTimeout(
          `https://api.unsplash.com/users/${handle}/photos?page=${page}&per_page=${perPage}&order_by=latest`,
          {
            headers: {
              Authorization: `Client-ID ${UNSPLASH_API_KEY}`,
            },
            next: { revalidate: 3600 }, // Cache for 1 hour
          },
          10000,
        );

        if (!res.ok) return [];

        const photos = await res.json();
        console.log(
          `[Unsplash] Fetched ${photos.length} photos for handle ${handle}`,
        );
        return photos.map((p) => ({
          id: p.id,
          url: p.urls.regular,
          thumb: p.urls.small,
          width: p.width,
          height: p.height,
          description: p.description || p.alt_description,
          link: p.links.html,
          userDisplayName: displayName,
          unsplashUser: handle,
          createdAt: new Date(p.created_at).getTime(),
        }));
      } catch (e) {
        console.error(`Error fetching Unsplash photos for ${handle}:`, e);
        return [];
      }
    }),
  );

  const mergedPhotos = allPhotos
    .flat()
    .sort((a, b) => b.createdAt - a.createdAt);

  // Return a slice based on pagination if we merged too many
  // Actually, since we fetch perPage for EACH, we might have handle.length * perPage.
  // We'll return the whole thing for now, and let the frontend handle it or adjust perPage.

  return mergedPhotos;
}
