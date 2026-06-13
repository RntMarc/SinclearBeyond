import { notFound, redirect } from "next/navigation";
import AppShell from "@/components/layout/Appshell";
import { InlineError } from "@/components/ui/InlineError";
import { getSessionWithSubs } from "@/lib/auth/sessionExtended";
import { phpFetch } from "@/lib/api/phpClient";
import { getProfileData } from "@/lib/profile/profile";
import RezepteDetailClient from "./RezepteDetailClient";

export default async function RezepteDetailPage({ params }) {
  const { id } = await params;
  const session = await getSessionWithSubs();

  if (!session) {
    redirect(`/login?callbackUrl=/rezepte/${id}`);
  }

  const profileData = await getProfileData(session);
  if (!profileData) redirect("/login");
  const { user } = profileData;

  const result = await phpFetch(`/recipes/${id}/detail`);
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
  const recipe = {
    id: data.id,
    title: data.title,
    description: data.description,
    category: data.category,
    servings: data.servings,
    dietaryTags: data.dietaryTags,
    image: data.image,
    creatorId: data.creatorId,
    creatorName: data.creatorName,
    creatorImage: data.creatorImage,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    avgRating: data.avgRating,
    reviewCount: data.reviewCount,
    ingredients: data.ingredients || [],
    steps: data.steps || [],
    isBookmarked: data.isBookmarked ? 1 : 0,
  };

  const reviews = (data.reviews || []).map((r) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.createdAt,
    userId: r.userId,
    user: {
      id: r.userId,
      displayName: r.displayName,
      image: r.image,
    },
  }));

  return (
    <AppShell user={user} session={session}>
      <RezepteDetailClient
        recipe={recipe}
        reviews={reviews}
        userId={session.sub}
      />
    </AppShell>
  );
}
