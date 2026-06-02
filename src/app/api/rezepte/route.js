import crypto from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db, safeQuery } from "@/lib/db/db";
import {
  recipeBookmarks,
  recipeIngredients,
  recipeReviews,
  recipeSteps,
  recipes,
  users,
} from "@/lib/db/schema";
import { processBase64Image } from "@/lib/images/imageProcessing";

export async function GET(req) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const tag = searchParams.get("tag");
  const q = searchParams.get("q");
  const bookmarkUserId = searchParams.get("bookmarkUserId");

  let query = db
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
    );

  if (bookmarkUserId) {
    query = query
      .innerJoin(
        recipeBookmarks,
        sql`${recipes.id} = ${recipeBookmarks.recipeId} AND ${recipeBookmarks.userId} = ${session.sub}`,
      )
      .leftJoin(
        recipeBookmarks,
        sql`${recipes.id} = ${recipeBookmarks.recipeId}`,
      );
  }

  const conditions = [];

  if (category && category !== "all") {
    conditions.push(eq(recipes.category, category));
  }

  if (tag) {
    conditions.push(sql`FIND_IN_SET(${tag}, ${recipes.dietaryTags})`);
  }

  if (q) {
    conditions.push(
      sql`(${recipes.title} LIKE ${`%${q}%`} OR ${recipes.description} LIKE ${`%${q}%`})`,
    );
  }

  if (conditions.length > 0) {
    query = query.where(...conditions);
  }

  const { data, error } = await safeQuery(
    query
      .groupBy(recipes.id, users.displayName, recipeBookmarks.id)
      .orderBy(sql`${recipes.createdAt} DESC`),
  );

  if (error) {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json(data || []);
}

export async function POST(req) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const {
      title,
      description,
      category,
      servings,
      dietaryTags,
      image,
      ingredients,
      steps,
    } = body;

    if (!title?.trim() || !category) {
      return NextResponse.json(
        { error: "Title and category are required" },
        { status: 400 },
      );
    }

    const id = crypto.randomUUID();
    const now = new Date();

    let processedImage = image || null;
    if (processedImage) {
      try {
        processedImage = await processBase64Image(image);
      } catch (err) {
        console.error(
          "[API/Rezepte] Image processing failed, storing original:",
          err,
        );
      }
    }

    const { error: insertError } = await safeQuery(
      db.insert(recipes).values({
        id,
        title: title.trim(),
        description: description?.trim() || null,
        category,
        servings: parseInt(servings, 10) || 4,
        dietaryTags: dietaryTags?.join(",") || null,
        image: processedImage,
        creatorId: session.sub,
        createdAt: now,
        updatedAt: now,
      }),
    );

    if (insertError) {
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    if (ingredients && ingredients.length > 0) {
      const ingredientValues = ingredients.map((ing, idx) => ({
        id: crypto.randomUUID(),
        recipeId: id,
        amount: parseFloat(ing.amount) || 0,
        unit: ing.unit || "",
        name: ing.name.trim(),
        order: idx,
      }));

      const { error: ingError } = await safeQuery(
        db.insert(recipeIngredients).values(ingredientValues),
      );

      if (ingError) {
        return NextResponse.json({ error: "Database error" }, { status: 500 });
      }
    }

    if (steps && steps.length > 0) {
      const stepValues = steps.map((step, idx) => ({
        id: crypto.randomUUID(),
        recipeId: id,
        category: step.category || "sonstiges",
        title: step.title?.trim() || null,
        description: step.description.trim(),
        order: idx,
      }));

      const { error: stepError } = await safeQuery(
        db.insert(recipeSteps).values(stepValues),
      );

      if (stepError) {
        return NextResponse.json({ error: "Database error" }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true, id });
  } catch (error) {
    console.error("[API/Rezepte] POST Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
