import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/db";
import { eventPermissions, events, users } from "@/lib/db/schema";

export async function GET(req, { params }) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const userId = session.sub;

  const [ev] = await db.select().from(events).where(eq(events.id, id)).limit(1);
  if (!ev) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const isCreator = ev.creatorId === userId;
  if (!isCreator) {
    const [perm] = await db
      .select()
      .from(eventPermissions)
      .where(
        and(
          eq(eventPermissions.eventId, id),
          eq(eventPermissions.userId, userId),
          eq(eventPermissions.canEdit, 1),
        ),
      )
      .limit(1);
    if (!perm)
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const rows = await db
    .select({
      userId: eventPermissions.userId,
      canView: eventPermissions.canView,
      canEdit: eventPermissions.canEdit,
      displayName: users.displayName,
      email: users.email,
    })
    .from(eventPermissions)
    .innerJoin(users, eq(users.id, eventPermissions.userId))
    .where(eq(eventPermissions.eventId, id));

  return NextResponse.json(rows);
}
