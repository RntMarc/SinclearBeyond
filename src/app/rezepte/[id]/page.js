import { eq, sql } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import AppShell from "@/components/layout/Appshell";
import { InlineError } from "@/components/ui/InlineError";
import { getSessionWithSubs } from "@/lib/auth/sessionExtended";
import { db, safeQuery } from "@/lib/db/db";
import {
  recipeBookmarks,
  recipeIngredients,
  recipeReviews,
  recipeSteps,
  recipes,
  users,
} from "@/lib/db/schema";
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

  const { data: recipeResult, error } = await safeQuery(
    db
      .select({
        id: recipes.id,
        title: recipes.title,
        description: recipes.description,
        category: recipes.category,
        servings: recipes.servings,
        dietaryTags: recipes.dietaryTags,
        image: recipes.image,
        creatorId: recipes.creatorId,
        creatorName: users.displayName,
        creatorImage: users.image,
        createdAt: recipes.createdAt,
        updatedAt: recipes.updatedAt,
        avgRating: sql`AVG(${recipeReviews.rating})`,
        reviewCount: sql`COUNT(${recipeReviews.id})`,
      })
      .from(recipes)
      .leftJoin(users, eq(recipes.creatorId, users.id))
      .leftJoin(recipeReviews, eq(recipes.id, recipeReviews.recipeId))
      .where(eq(recipes.id, id))
      .groupBy(recipes.id, users.displayName, users.image)
      .limit(1),
  );

  if (error) {
    return (
      <AppShell user={user} session={session}>
        <div className="p-6">
          <InlineError />
        </div>
      </AppShell>
    );
  }

  if (!recipeResult || recipeResult.length === 0) {
    notFound();
  }

  const recipe = recipeResult[0];

  const [ingredientsRes, stepsRes, reviewsRes, bookmarksRes] =
    await Promise.all([
      safeQuery(
        db
          .select()
          .from(recipeIngredients)
          .where(eq(recipeIngredients.recipeId, id))
          .orderBy(recipeIngredients.order),
      ),
      safeQuery(
        db
          .select()
          .from(recipeSteps)
          .where(eq(recipeSteps.recipeId, id))
          .orderBy(recipeSteps.order),
      ),
      safeQuery(
        db
          .select({
            id: recipeReviews.id,
            rating: recipeReviews.rating,
            comment: recipeReviews.comment,
            createdAt: recipeReviews.createdAt,
            userId: recipeReviews.userId,
            user: {
              id: users.id,
              displayName: users.displayName,
              image: users.image,
            },
          })
          .from(recipeReviews)
          .innerJoin(users, eq(recipeReviews.userId, users.id))
          .where(eq(recipeReviews.recipeId, id))
          .orderBy(sql`${recipeReviews.createdAt} DESC`),
      ),
      safeQuery(
        db
          .select({ id: recipeBookmarks.id })
          .from(recipeBookmarks)
          .where(
            sql`${recipeBookmarks.recipeId} = ${id} AND ${recipeBookmarks.userId} = ${session.sub}`,
          )
          .limit(1),
      ),
    ]);

  const reviewsError = reviewsRes.error;

  return (
    <AppShell user={user} session={session}>
      {reviewsError && (
        <div className="px-6 pt-6">
          <InlineError />
        </div>
      )}
      <RezepteDetailClient
        recipe={{
          ...recipe,
          ingredients: ingredientsRes.data || [],
          steps: stepsRes.data || [],
          isBookmarked:
            bookmarksRes.data && bookmarksRes.data.length > 0 ? 1 : 0,
        }}
        reviews={reviewsRes.data || []}
        userId={session.sub}
      />
    </AppShell>
  );
}
