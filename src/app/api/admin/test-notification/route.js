import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db, safeQuery } from "@/lib/db/db";
import { notifications } from "@/lib/db/schema";
import { sendPushToUsers } from "@/lib/notifications/push";

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

    const results = { internal: 0, push: 0, errors: [] };

    const now = new Date();
    const testId = `test-${Date.now()}`;
    const notificationValues = userIds.map((uid) => ({
      id: crypto.randomUUID(),
      userId: uid,
      type,
      entityId: testId,
      createdAt: now,
    }));

    const { error: insertError } = await safeQuery(
      db.insert(notifications).values(notificationValues),
    );

    if (insertError) {
      results.errors.push("Failed to create internal notifications");
    } else {
      results.internal = notificationValues.length;
    }

    try {
      await sendPushToUsers(userIds, {
        title: title || "Test-Benachrichtigung",
        body: body || "Dies ist eine Test-Benachrichtigung",
        url: url || "/home",
        tag: testId,
      });
      results.push = userIds.length;
    } catch {
      results.errors.push("Failed to send push notifications");
    }

    return NextResponse.json(results);
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }
}
