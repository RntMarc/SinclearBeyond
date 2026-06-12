import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { phpFetch } from "@/lib/api/phpClient";

export async function GET() {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // 1. Get all forums where user is member
    const myForumsResult = await phpFetch("/forums/my");
    const joined = myForumsResult.ok ? (myForumsResult.data?.data || []) : [];

    // 2. Get all other forums
    const allForumsResult = await phpFetch("/forums");

    if (!allForumsResult.ok) {
      return NextResponse.json(
        { error: "Failed to fetch forums" },
        { status: 500 },
      );
    }

    const allForumsData = allForumsResult.data;
    const allForums = allForumsData?.data || [];
    const joinedIds = joined.map((f) => f.id);
    const notJoined = allForums.filter((f) => !joinedIds.includes(f.id));

    return NextResponse.json({
      joined: joined || [],
      notJoined: notJoined || [],
    });
  } catch (error) {
    console.error("[API/Forums/Overview] Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
