import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { phpFetch } from "@/lib/api/phpClient";

export async function PATCH(req, { params }) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const { rating, comment } = await req.json();

    if (!rating) {
      return NextResponse.json(
        { error: "Rating is required" },
        { status: 400 },
      );
    }

    const reviewRes = await phpFetch(`/discover-reviews/${id}`);
    if (!reviewRes.ok) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    const review = reviewRes.data;
    if (review.userId !== session.sub && !session.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updateResult = await phpFetch(`/discover-reviews/${id}`, {
      method: "PATCH",
      body: { rating: parseInt(rating, 10), comment },
    });

    if (!updateResult.ok) {
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[API/Discover/Reviews/[id]] PATCH Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(_req, { params }) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const reviewRes = await phpFetch(`/discover-reviews/${id}`);
    if (!reviewRes.ok) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    const review = reviewRes.data;
    if (review.userId !== session.sub && !session.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const deleteResult = await phpFetch(`/discover-reviews/${id}`, {
      method: "DELETE",
    });

    if (!deleteResult.ok) {
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[API/Discover/Reviews/[id]] DELETE Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
