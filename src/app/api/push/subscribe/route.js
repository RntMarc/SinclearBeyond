import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { phpFetch } from "@/lib/api/phpClient";

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

    // Delete existing subscription for this endpoint to avoid duplicates
    await phpFetch(`/push-subscriptions?endpoint=${encodeURIComponent(endpoint)}`, {
      method: "DELETE",
    });

    // Create new subscription via generic CRUD
    const id = crypto.randomUUID();
    const result = await phpFetch("/push-subscriptions", {
      method: "POST",
      body: {
        id,
        userId: session.sub,
        endpoint,
        p256dh,
        auth,
        createdAt: new Date().toISOString(),
      },
    });

    if (!result.ok) {
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
    await phpFetch(`/push-subscriptions?endpoint=${encodeURIComponent(endpoint)}`, {
      method: "DELETE",
    });
  } else {
    await phpFetch(`/push-subscriptions?userId=${session.sub}`, {
      method: "DELETE",
    });
  }

  return NextResponse.json({ ok: true });
}

export async function GET(_req) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await phpFetch(`/push-subscriptions?userId=${session.sub}`);
  if (!result.ok) {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json(result.data?.data || []);
}
