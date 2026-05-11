import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { searchGames } from "@/lib/kritik/igdb";

export async function GET(req) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");

  if (!q) {
    return NextResponse.json([]);
  }

  try {
    const results = await searchGames(q);
    return NextResponse.json(results);
  } catch (error) {
    console.error("[API/Kritik/Search] Error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
