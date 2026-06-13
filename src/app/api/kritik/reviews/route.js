import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { phpFetch } from "@/lib/api/phpClient";

export async function GET(req) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const itemId = searchParams.get("itemId");

  if (!itemId) {
    return NextResponse.json({ error: "itemId is required" }, { status: 400 });
  }

  try {
    const result = await phpFetch(`/media/${itemId}/reviews`);
    if (!result.ok) {
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 },
      );
    }

    return NextResponse.json(result.data?.data || []);
  } catch (error) {
    console.error("[API/Kritik/Reviews] GET Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(req) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await req.json();
    const { itemId, rating, comment, platform } = data;

    if (!itemId || !rating) {
      return NextResponse.json(
        { error: "itemId and rating are required" },
        { status: 400 },
      );
    }

    const result = await phpFetch(`/media/${itemId}/reviews`, {
      method: "POST",
      body: { rating: parseInt(rating, 10), comment, platform },
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, id: result.data?.data?.id });
  } catch (error) {
    console.error("[API/Kritik/Reviews] POST Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
