import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { sendNotification } from "@/lib/notifications/service";

export async function POST(req) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!session.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { userIds, type = "test", title, body, url } = await req.json();

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: "No recipients specified" },
        { status: 400 },
      );
    }

    const testId = `test-${Date.now()}`;

    await sendNotification({
      userIds,
      type,
      entityId: testId,
      title: title || "Test-Benachrichtigung",
      body: body || "Dies ist eine Test-Benachrichtigung",
      link: url || "/home",
      tag: testId,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }
}
