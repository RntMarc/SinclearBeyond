import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/db";
import { events } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import crypto from "node:crypto";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const rows = await db.select().from(events).orderBy(events.startAt);
  return NextResponse.json(rows);
}

export async function POST(req) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { title, description, startAt, endAt, allDay } = await req.json();
  if (!title?.trim() || !startAt) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const id = crypto.randomUUID();
  const now = new Date();

  await db.insert(events).values({
    id,
    title: title.trim(),
    description: description?.trim() || null,
    startAt: new Date(startAt),
    endAt: endAt ? new Date(endAt) : null,
    allDay: allDay ? 1 : 0,
    createdAt: now,
    creatorId: session.sub,
  });

  const [row] = await db.select().from(events).where(eq(events.id, id)).limit(1);
  return NextResponse.json(row, { status: 201 });
}
