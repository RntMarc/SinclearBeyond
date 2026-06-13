import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { phpFetch } from "@/lib/api/phpClient";

export async function POST(req) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { recipeId } = await req.json();

    const existing = await phpFetch(
      `/recipe-bookmarks?userId=${session.sub}&recipeId=${recipeId}&limit=1`,
    );
    const existingBookmark = existing.ok && existing.data?.[0];

    if (existingBookmark) {
      const del = await phpFetch(`/recipe-bookmarks/${existingBookmark.id}`, {
        method: "DELETE",
      });
      if (!del.ok) throw new Error(del.error);
      return NextResponse.json({ ok: true, bookmarked: false });
    } else {
      const ins = await phpFetch("/recipe-bookmarks", {
        method: "POST",
        body: { userId: session.sub, recipeId },
      });
      if (!ins.ok) throw new Error(ins.error);
      return NextResponse.json({ ok: true, bookmarked: true });
    }
  } catch (error) {
    console.error("[API/Rezepte/Bookmarks] POST Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
