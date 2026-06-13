import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { phpFetch } from "@/lib/api/phpClient";

export async function POST(req) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { placeId, rating, comment } = await req.json();

    if (!placeId || !rating) {
      return NextResponse.json(
        { error: "Place ID and rating are required" },
        { status: 400 },
      );
    }

    const result = await phpFetch("/discover-reviews", {
      method: "POST",
      body: {
        placeId,
        userId: session.sub,
        rating: parseInt(rating, 10),
        comment,
      },
    });

    if (!result.ok) {
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id: result.data?.data?.id });
  } catch (error) {
    console.error("[API/Discover/Reviews] POST Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
