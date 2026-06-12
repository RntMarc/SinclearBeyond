"use server";
import { phpFetch } from "@/lib/api/phpClient";
import { getSession } from "@/lib/auth/session";
import { fetchWithTimeout } from "@/lib/utils";

const UNSPLASH_API_KEY = process.env.UNSPLASH_API_KEY;

export async function getUnsplashPhotos({ page = 1, perPage = 20 } = {}) {
  const session = await getSession();
  if (!session?.sub) return [];

  // 1. Get all users who have a visible Unsplash handle
  const result = await phpFetch("/social-info/unsplash-visible");
  if (!result.ok) return [];

  const visibleSocialInfos = result.data?.data || [];

  const handles = (visibleSocialInfos || [])
    .filter((s) => s.unsplashHandle)
    .map((s) => ({
      handle: s.unsplashHandle,
      displayName: s.displayName,
      userId: s.userId,
    }));

  if (handles.length === 0) {
    return [];
  }

  // 2. Fetch photos for each handle
  const allPhotos = await Promise.all(
    handles.map(async ({ handle, displayName }) => {
      try {
        const res = await fetchWithTimeout(
          `https://api.unsplash.com/users/${handle}/photos?page=${page}&per_page=${perPage}&order_by=latest`,
          {
            headers: {
              Authorization: `Client-ID ${UNSPLASH_API_KEY}`,
            },
            next: { revalidate: 3600 },
          },
          20000,
        );

        if (!res.ok) return [];

        const photos = await res.json();
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

  return mergedPhotos;
}
