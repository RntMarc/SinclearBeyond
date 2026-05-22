import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth/session";
import { db, safeQuery } from "@/lib/db/db";
import { eventPermissions, events, users } from "@/lib/db/schema";

export async function GET(_req, { params }) {
  const t = await getTranslations("Common");
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: t("unauthorized") }, { status: 401 });

  const { id } = await params;
  const userId = session.sub;

  const { data: evData, error: evError } = await safeQuery(
    db.select().from(events).where(eq(events.id, id)).limit(1),
  );
  if (evError) throw evError;
  const ev = evData?.[0];
  if (!ev) return NextResponse.json({ error: t("notFound") }, { status: 404 });

  const isCreator = ev.creatorId === userId;
  if (!isCreator) {
    const { data: perms, error: permError } = await safeQuery(
      db
        .select()
        .from(eventPermissions)
        .where(
          and(
            eq(eventPermissions.eventId, id),
            eq(eventPermissions.userId, userId),
            eq(eventPermissions.canEdit, 1),
          ),
        )
        .limit(1),
    );
    if (permError) throw permError;
    const perm = perms?.[0];
    if (!perm)
      return NextResponse.json({ error: t("forbidden") }, { status: 403 });
  }

  const { data: rows, error: rowsError } = await safeQuery(
    db
      .select({
        userId: eventPermissions.userId,
        canView: eventPermissions.canView,
        canEdit: eventPermissions.canEdit,
        displayName: users.displayName,
        email: users.email,
      })
      .from(eventPermissions)
      .innerJoin(users, eq(users.id, eventPermissions.userId))
      .where(eq(eventPermissions.eventId, id)),
  );

  if (rowsError) throw rowsError;

  return NextResponse.json(rows || []);
}
