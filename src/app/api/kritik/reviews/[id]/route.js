import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { phpFetch } from "@/lib/api/phpClient";

export async function DELETE(_req, { params }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const reviewRes = await phpFetch(`/media-reviews/${id}`);
    if (!reviewRes.ok) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    const review = reviewRes.data;
    if (review.userId !== session.sub && !session.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const deleteResult = await phpFetch(`/media-reviews/${id}`, {
      method: "DELETE",
    });
    if (!deleteResult.ok) throw new Error(deleteResult.error);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[API/Kritik/Reviews/Delete] Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
