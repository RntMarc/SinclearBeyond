import crypto from "node:crypto";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db, safeQuery } from "@/lib/db/db";
import { recipeBookmarks } from "@/lib/db/schema";

export async function POST(req) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { recipeId } = await req.json();

    const { data: existingData } = await safeQuery(
      db
        .select()
        .from(recipeBookmarks)
        .where(
          and(
            eq(recipeBookmarks.userId, session.sub),
            eq(recipeBookmarks.recipeId, recipeId),
          ),
        )
        .limit(1),
    );

    const existing = existingData?.[0];

    if (existing) {
      const { error: deleteError } = await safeQuery(
        db
          .delete(recipeBookmarks)
          .where(eq(recipeBookmarks.id, existing.id)),
      );
      if (deleteError) throw deleteError;
      return NextResponse.json({ ok: true, bookmarked: false });
    } else {
      const { error: insertError } = await safeQuery(
        db.insert(recipeBookmarks).values({
          id: crypto.randomUUID(),
          userId: session.sub,
          recipeId,
          createdAt: new Date(),
        }),
      );
      if (insertError) throw insertError;
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
