import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { phpFetch } from "@/lib/api/phpClient";

export async function GET(req) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const recipeId = searchParams.get("recipeId");

  if (!recipeId) {
    return NextResponse.json(
      { error: "recipeId is required" },
      { status: 400 },
    );
  }

  const result = await phpFetch(`/recipe-reviews?recipeId=${recipeId}`);
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
    const { recipeId, rating, comment } = await req.json();

    if (!recipeId || !rating) {
      return NextResponse.json(
        { error: "Recipe ID and rating are required" },
        { status: 400 },
      );
    }

    const result = await phpFetch("/recipe-reviews", {
      method: "POST",
      body: {
        recipeId,
        userId: session.sub,
        rating: parseInt(rating, 10),
        comment,
      },
    });

    if (!result.ok) {
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id: result.data?.data?.id });
  } catch (error) {
    console.error("[API/Rezepte/Reviews] POST Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
