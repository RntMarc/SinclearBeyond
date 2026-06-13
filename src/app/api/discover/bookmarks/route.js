import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { phpFetch } from "@/lib/api/phpClient";

export async function GET(_req) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const result = await phpFetch("/discover/bookmarked");
    if (!result.ok) {
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 },
      );
    }

    return NextResponse.json(result.data?.data || []);
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

    const existing = await phpFetch(
      `/discover-bookmarks?userId=${session.sub}&placeId=${placeId}&limit=1`,
    );
    const existingBookmark = existing.ok && existing.data?.[0];

    if (existingBookmark) {
      const del = await phpFetch(`/discover-bookmarks/${existingBookmark.id}`, {
        method: "DELETE",
      });
      if (!del.ok) throw new Error(del.error);
      return NextResponse.json({ ok: true, bookmarked: false });
    } else {
      const ins = await phpFetch("/discover-bookmarks", {
        method: "POST",
        body: { userId: session.sub, placeId },
      });
      if (!ins.ok) throw new Error(ins.error);
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
