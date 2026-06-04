import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db, safeQuery } from "@/lib/db/db";
import { pushSubscriptions } from "@/lib/db/schema";

export async function POST(req) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const endpoint = body.endpoint;
    const p256dh = body.keys?.p256dh;
    const auth = body.keys?.auth;

    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json(
        { error: "Invalid subscription" },
        { status: 400 },
      );
    }

    const now = new Date();

    // Delete existing subscription for this endpoint to avoid duplicates
    await safeQuery(
      db
        .delete(pushSubscriptions)
        .where(eq(pushSubscriptions.endpoint, endpoint)),
    );

    const id = crypto.randomUUID();
    const { error } = await safeQuery(
      db.insert(pushSubscriptions).values({
        id,
        userId: session.sub,
        endpoint,
        p256dh,
        auth,
        createdAt: now,
      }),
    );

    if (error) {
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }
}

export async function DELETE(req) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const endpoint = searchParams.get("endpoint");

  if (endpoint) {
    await safeQuery(
      db
        .delete(pushSubscriptions)
        .where(
          and(
            eq(pushSubscriptions.endpoint, endpoint),
            eq(pushSubscriptions.userId, session.sub),
          ),
        ),
    );
  } else {
    await safeQuery(
      db
        .delete(pushSubscriptions)
        .where(eq(pushSubscriptions.userId, session.sub)),
    );
  }

  return NextResponse.json({ ok: true });
}

export async function GET(_req) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await safeQuery(
    db
      .select({
        id: pushSubscriptions.id,
        endpoint: pushSubscriptions.endpoint,
        createdAt: pushSubscriptions.createdAt,
      })
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, session.sub)),
  );

  if (error) {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json(data || []);
}
