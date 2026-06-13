import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { processBase64Image } from "@/lib/images/imageProcessing";
import { phpFetch } from "@/lib/api/phpClient";

export async function GET(req) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await phpFetch("/recipes/list");
  if (!result.ok) {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json(result.data?.data || []);
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

    const recipeResult = await phpFetch("/recipes", {
      method: "POST",
      body: {
        title: title.trim(),
        description: description?.trim() || null,
        category,
        servings: parseInt(servings, 10) || 4,
        dietaryTags: dietaryTags?.join(",") || null,
        image: processedImage,
        creatorId: session.sub,
      },
    });

    if (!recipeResult.ok) {
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    const id = recipeResult.data?.data?.id;

    if (ingredients && ingredients.length > 0) {
      const ingredientValues = ingredients.map((ing, idx) => ({
        id: crypto.randomUUID(),
        recipeId: id,
        amount: parseFloat(ing.amount) || 0,
        unit: ing.unit || "",
        name: ing.name.trim(),
        order: idx,
      }));

      await phpFetch("/recipe-ingredients", {
        method: "POST",
        body: ingredientValues,
      });
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

      await phpFetch("/recipe-steps", {
        method: "POST",
        body: stepValues,
      });
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
