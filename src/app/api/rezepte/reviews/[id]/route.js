import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { phpFetch } from "@/lib/api/phpClient";

export async function PATCH(req, { params }) {
  const { id } = await params;
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { rating, comment } = await req.json();

    const existingRes = await phpFetch(`/recipe-reviews/${id}`);
    if (!existingRes.ok) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (existingRes.data.userId !== session.sub && !session.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updateData = {};
    if (rating !== undefined) updateData.rating = parseInt(rating, 10);
    if (comment !== undefined) updateData.comment = comment;

    const updateResult = await phpFetch(`/recipe-reviews/${id}`, {
      method: "PATCH",
      body: updateData,
    });

    if (!updateResult.ok) {
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[API/Rezepte/Reviews] PATCH Error:", error);
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

  const existingRes = await phpFetch(`/recipe-reviews/${id}`);
  if (!existingRes.ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (existingRes.data.userId !== session.sub && !session.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const deleteResult = await phpFetch(`/recipe-reviews/${id}`, {
    method: "DELETE",
  });

  if (!deleteResult.ok) {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
