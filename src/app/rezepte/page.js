import { eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import AppShell from "@/components/layout/Appshell";
import { InlineError } from "@/components/ui/InlineError";
import { getSessionWithSubs } from "@/lib/auth/sessionExtended";
import { db, safeQuery } from "@/lib/db/db";
import {
  recipeBookmarks,
  recipeReviews,
  recipes,
  users,
} from "@/lib/db/schema";
import { getProfileData } from "@/lib/profile/profile";
import RezepteClient from "./RezepteClient";

export default async function RezeptePage() {
  const session = await getSessionWithSubs();

  if (!session) {
    redirect("/login?callbackUrl=/rezepte");
  }

  const data = await getProfileData(session);
  if (!data) redirect("/login");
  const { user } = data;

  const { data: recipesData, error } = await safeQuery(
    db
      .select({
        id: recipes.id,
        title: recipes.title,
        description: recipes.description,
        category: recipes.category,
        dietaryTags: recipes.dietaryTags,
        image: recipes.image,
        creatorId: recipes.creatorId,
        creatorName: users.displayName,
        createdAt: recipes.createdAt,
        avgRating: sql`AVG(${recipeReviews.rating})`,
        reviewCount: sql`COUNT(${recipeReviews.id})`,
        isBookmarked: sql`CASE WHEN ${recipeBookmarks.id} IS NOT NULL THEN 1 ELSE 0 END`,
      })
      .from(recipes)
      .leftJoin(users, eq(recipes.creatorId, users.id))
      .leftJoin(recipeReviews, eq(recipes.id, recipeReviews.recipeId))
      .leftJoin(
        recipeBookmarks,
        sql`${recipes.id} = ${recipeBookmarks.recipeId} AND ${recipeBookmarks.userId} = ${session.sub}`,
      )
      .groupBy(recipes.id, users.displayName, recipeBookmarks.id)
      .orderBy(sql`${recipes.createdAt} DESC`),
  );

  return (
    <AppShell user={user} session={session}>
      {error && (
        <div className="p-6">
          <InlineError />
        </div>
      )}
      <RezepteClient initialRecipes={recipesData || []} userId={session.sub} />
    </AppShell>
  );
}
