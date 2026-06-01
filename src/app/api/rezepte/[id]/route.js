import crypto from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db, safeQuery } from "@/lib/db/db";
import {
  recipeBookmarks,
  recipeIngredients,
  recipeReviews,
  recipes,
  recipeSteps,
  users,
} from "@/lib/db/schema";

export async function GET(_req, { params }) {
  const { id } = await params;
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: recipeData, error } = await safeQuery(
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
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  if (!recipeData || recipeData.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const recipe = recipeData[0];

  const [ingredientsRes, stepsRes, bookmarksRes] = await Promise.all([
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
        .select({ id: recipeBookmarks.id })
        .from(recipeBookmarks)
        .where(
          sql`${recipeBookmarks.recipeId} = ${id} AND ${recipeBookmarks.userId} = ${session.sub}`,
        )
        .limit(1),
    ),
  ]);

  recipe.ingredients = ingredientsRes.data || [];
  recipe.steps = stepsRes.data || [];
  recipe.isBookmarked = (bookmarksRes.data && bookmarksRes.data.length > 0) ? 1 : 0;

  return NextResponse.json(recipe);
}

export async function PATCH(req, { params }) {
  const { id } = await params;
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { title, description, category, servings, dietaryTags, image, ingredients, steps } = body;

    const { data: existing } = await safeQuery(
      db
        .select({ creatorId: recipes.creatorId })
        .from(recipes)
        .where(eq(recipes.id, id))
        .limit(1),
    );

    if (!existing || existing.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (existing[0].creatorId !== session.sub && !session.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updateData = { updatedAt: new Date() };
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (category !== undefined) updateData.category = category;
    if (servings !== undefined) updateData.servings = parseInt(servings, 10) || 4;
    if (dietaryTags !== undefined) updateData.dietaryTags = dietaryTags?.join(",") || null;
    if (image !== undefined) updateData.image = image || null;

    const { error: updateError } = await safeQuery(
      db.update(recipes).set(updateData).where(eq(recipes.id, id)),
    );

    if (updateError) {
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    if (ingredients !== undefined) {
      await safeQuery(db.delete(recipeIngredients).where(eq(recipeIngredients.recipeId, id)));
      if (ingredients.length > 0) {
        const ingredientValues = ingredients.map((ing, idx) => ({
          id: crypto.randomUUID(),
          recipeId: id,
          amount: parseFloat(ing.amount) || 0,
          unit: ing.unit || "",
          name: ing.name.trim(),
          order: idx,
        }));
        await safeQuery(db.insert(recipeIngredients).values(ingredientValues));
      }
    }

    if (steps !== undefined) {
      await safeQuery(db.delete(recipeSteps).where(eq(recipeSteps.recipeId, id)));
      if (steps.length > 0) {
        const stepValues = steps.map((step, idx) => ({
          id: crypto.randomUUID(),
          recipeId: id,
          category: step.category || "sonstiges",
          title: step.title?.trim() || null,
          description: step.description.trim(),
          order: idx,
        }));
        await safeQuery(db.insert(recipeSteps).values(stepValues));
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[API/Rezepte] PATCH Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(_req, { params }) {
  const { id } = await params;
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: existing } = await safeQuery(
    db
      .select({ creatorId: recipes.creatorId })
      .from(recipes)
      .where(eq(recipes.id, id))
      .limit(1),
  );

  if (!existing || existing.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (existing[0].creatorId !== session.sub && !session.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await Promise.all([
    safeQuery(db.delete(recipeIngredients).where(eq(recipeIngredients.recipeId, id))),
    safeQuery(db.delete(recipeSteps).where(eq(recipeSteps.recipeId, id))),
    safeQuery(db.delete(recipeReviews).where(eq(recipeReviews.recipeId, id))),
    safeQuery(db.delete(recipeBookmarks).where(eq(recipeBookmarks.recipeId, id))),
  ]);

  const { error } = await safeQuery(
    db.delete(recipes).where(eq(recipes.id, id)),
  );

  if (error) {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
