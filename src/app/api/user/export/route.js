import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { phpFetch } from "@/lib/api/phpClient";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await phpFetch(`/users/${session.sub}/export`);
    if (!result.ok) {
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 },
      );
    }

    const data = result.data?.data || result.data;
    return NextResponse.json({
      discover: data.discoverReviews || [],
      media: data.mediaReviews || [],
      episodes: data.episodeReviews || [],
    });
  } catch (error) {
    console.error("[API/User/Export] GET Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
