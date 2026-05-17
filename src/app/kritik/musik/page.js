import { eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import AppShell from "@/components/layout/Appshell";
import { getSessionWithSubs } from "@/lib/auth/sessionExtended";
import { db } from "@/lib/db/db";
import { mediaItems, mediaReviews } from "@/lib/db/schema";
import { getProfileData } from "@/lib/profile/profile";
import MusicClient from "./MusicClient";

export default async function MusicPage() {
  const session = await getSessionWithSubs();

  if (!session) {
    redirect("/login?callbackUrl=/kritik/musik");
  }

  const data = await getProfileData(session);
  if (!data) redirect("/login");
  const { user } = data;

  const music = await db
    .select({
      id: mediaItems.id,
      title: mediaItems.title,
      description: mediaItems.description,
      image: mediaItems.image,
      type: mediaItems.type,
      avgRating: sql`AVG(${mediaReviews.rating})`,
      reviewCount: sql`COUNT(${mediaReviews.id})`,
    })
    .from(mediaItems)
    .innerJoin(mediaReviews, eq(mediaItems.id, mediaReviews.itemId))
    .where(eq(mediaItems.type, "music"))
    .groupBy(mediaItems.id)
    .orderBy(sql`${mediaItems.updatedAt} DESC`);

  return (
    <AppShell user={user} session={session}>
      <MusicClient initialMusic={music} />
    </AppShell>
  );
}
