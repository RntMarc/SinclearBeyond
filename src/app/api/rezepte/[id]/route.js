import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { processBase64Image } from "@/lib/images/imageProcessing";
import { phpFetch } from "@/lib/api/phpClient";

export async function GET(_req, { params }) {
  const { id } = await params;
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await phpFetch(`/recipes/${id}/detail`);
  if (!result.ok) {
    if (result.status === 404) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json(result.data?.data || result.data);
}

export async function PATCH(req, { params }) {
  const { id } = await params;
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

    const existingRes = await phpFetch(`/recipes/${id}`);
    if (!existingRes.ok) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (existingRes.data.creatorId !== session.sub && !session.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updateData = { updatedAt: new Date().toISOString() };
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined)
      updateData.description = description?.trim() || null;
    if (category !== undefined) updateData.category = category;
    if (servings !== undefined)
      updateData.servings = parseInt(servings, 10) || 4;
    if (dietaryTags !== undefined)
      updateData.dietaryTags = dietaryTags?.join(",") || null;
    if (image !== undefined) {
      if (image) {
        try {
          updateData.image = await processBase64Image(image);
        } catch (err) {
          console.error(
            "[API/Rezepte] PATCH image processing failed, storing original:",
            err,
          );
          updateData.image = image;
        }
      } else {
        updateData.image = null;
      }
    }

    const updateResult = await phpFetch(`/recipes/${id}`, {
      method: "PATCH",
      body: updateData,
    });

    if (!updateResult.ok) {
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    if (ingredients !== undefined) {
      await phpFetch(`/recipe-ingredients?recipeId=${id}`, { method: "DELETE" });
      if (ingredients.length > 0) {
        const ingredientValues = ingredients.map((ing, idx) => ({
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
    }

    if (steps !== undefined) {
      await phpFetch(`/recipe-steps?recipeId=${id}`, { method: "DELETE" });
      if (steps.length > 0) {
        const stepValues = steps.map((step, idx) => ({
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
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[API/Rezepte] PATCH Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(_req, { params }) {
  const { id } = await params;
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existingRes = await phpFetch(`/recipes/${id}`);
  if (!existingRes.ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (existingRes.data.creatorId !== session.sub && !session.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await Promise.all([
    phpFetch(`/recipe-ingredients?recipeId=${id}`, { method: "DELETE" }),
    phpFetch(`/recipe-steps?recipeId=${id}`, { method: "DELETE" }),
    phpFetch(`/recipe-reviews?recipeId=${id}`, { method: "DELETE" }),
    phpFetch(`/recipe-bookmarks?recipeId=${id}`, { method: "DELETE" }),
  ]);

  const deleteResult = await phpFetch(`/recipes/${id}`, { method: "DELETE" });

  if (!deleteResult.ok) {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
