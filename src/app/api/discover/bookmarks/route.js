import crypto from "node:crypto";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/db";
import { discoverBookmarks, discoverPlaces } from "@/lib/db/schema";

export async function GET(req) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const bookmarks = await db
      .select({
        id: discoverPlaces.id,
        name: discoverPlaces.name,
        category: discoverPlaces.category,
        address: discoverPlaces.address,
      })
      .from(discoverBookmarks)
      .innerJoin(
        discoverPlaces,
        eq(discoverBookmarks.placeId, discoverPlaces.id),
      )
      .where(eq(discoverBookmarks.userId, session.sub));

    return NextResponse.json(bookmarks);
  } catch (error) {
    console.error("[API/Discover/Bookmarks] GET Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(req) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { placeId } = await req.json();

    const [existing] = await db
      .select()
      .from(discoverBookmarks)
      .where(
        and(
          eq(discoverBookmarks.userId, session.sub),
          eq(discoverBookmarks.placeId, placeId),
        ),
      )
      .limit(1);

    if (existing) {
      await db
        .delete(discoverBookmarks)
        .where(eq(discoverBookmarks.id, existing.id));
      return NextResponse.json({ ok: true, bookmarked: false });
    } else {
      await db.insert(discoverBookmarks).values({
        id: crypto.randomUUID(),
        userId: session.sub,
        placeId,
        createdAt: new Date(),
      });
      return NextResponse.json({ ok: true, bookmarked: true });
    }
  } catch (error) {
    console.error("[API/Discover/Bookmarks] POST Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
