import { notFound, redirect } from "next/navigation";
import AppShell from "@/components/layout/Appshell";
import { InlineError } from "@/components/ui/InlineError";
import { getSessionWithSubs } from "@/lib/auth/sessionExtended";
import { phpFetch } from "@/lib/api/phpClient";
import { getProfileData } from "@/lib/profile/profile";
import MovieDetailPageClient from "./MovieDetailPageClient";

export default async function MovieDetailPage({ params }) {
  const { id } = await params;
  const session = await getSessionWithSubs();

  if (!session) {
    redirect(`/login?callbackUrl=/kritik/filme/${id}`);
  }

  const profileData = await getProfileData(session);
  if (!profileData) redirect("/login");
  const { user } = profileData;

  const result = await phpFetch(`/media/${id}/detail`);
  if (!result.ok) {
    if (result.status === 404) notFound();
    return (
      <AppShell user={user} session={session}>
        <div className="p-6">
          <InlineError />
        </div>
      </AppShell>
    );
  }

  const data = result.data?.data || {};
  const movie = data.item;
  if (data.episodes) movie.episodes = data.episodes;

  const reviews = (data.reviews || []).map((r) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    platform: r.platform,
    createdAt: r.createdAt,
    user: {
      id: r.userId,
      displayName: r.displayName,
      image: r.image,
    },
  }));

  return (
    <AppShell user={user} session={session}>
      <MovieDetailPageClient
        movie={movie}
        reviews={reviews}
        userId={session.sub}
      />
    </AppShell>
  );
}
