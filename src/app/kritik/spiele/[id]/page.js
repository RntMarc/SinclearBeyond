import { notFound, redirect } from "next/navigation";
import AppShell from "@/components/layout/Appshell";
import { InlineError } from "@/components/ui/InlineError";
import { getSessionWithSubs } from "@/lib/auth/sessionExtended";
import { phpFetch } from "@/lib/api/phpClient";
import { getProfileData } from "@/lib/profile/profile";
import GameDetailPageClient from "./GameDetailPageClient";

export default async function GameDetailPage({ params }) {
  const { id } = await params;
  const session = await getSessionWithSubs();

  if (!session) {
    redirect(`/login?callbackUrl=/kritik/spiele/${id}`);
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
  const game = data.item;
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
      <GameDetailPageClient
        game={game}
        reviews={reviews}
        userId={session.sub}
      />
    </AppShell>
  );
}
