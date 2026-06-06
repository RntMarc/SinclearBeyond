import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { verifyInternalHmac } from "@/lib/auth/internalV2";
import { db, safeQuery } from "@/lib/db/db";
import { users } from "@/lib/db/schema";

export async function POST(req) {
  const url = new URL(req.url);
  const path = url.pathname;
  const rawBody = await req.text();
  const headers = Object.fromEntries(req.headers);

  if (!verifyInternalHmac({ method: "POST", path, body: rawBody, headers })) {
    return NextResponse.json(
      { error: "Invalid or missing internal HMAC signature" },
      { status: 401 },
    );
  }

  let body;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const userId = body?.user_id;
  if (!userId) {
    return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
  }

  try {
    const { data: userRows } = await safeQuery(
      db.select().from(users).where(eq(users.id, userId)).limit(1),
    );
    const user = userRows?.[0];
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user_id: user.id,
      display_name: user.displayName,
      avatar: user.image || null,
      status_message: null,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error?.message || "Failed to fetch profile" },
      { status: 500 },
    );
  }
}
