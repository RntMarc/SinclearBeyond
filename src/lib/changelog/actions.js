"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { db, safeQuery } from "@/lib/db/db";
import { changelogEntries, readStatuses } from "@/lib/db/schema";

export async function createChangelogEntry(data) {
  const session = await getSession();
  if (!session?.isAdmin) {
    throw new Error("Unauthorized");
  }

  const id = crypto.randomUUID();
  const { error } = await safeQuery(
    db.insert(changelogEntries).values({
      id,
      title: data.title,
      content: data.content,
      category: data.category,
      createdAt: new Date(),
    }),
  );

  if (error) throw error;

  revalidatePath("/info");
  return { ok: true };
}

export async function getChangelogEntries() {
  const session = await getSession();
  if (!session) return [];

  const { data: entries, error: entriesError } = await safeQuery(
    db.select().from(changelogEntries).orderBy(changelogEntries.createdAt),
  );

  const { data: readEntries, error: readError } = await safeQuery(
    db
      .select()
      .from(readStatuses)
      .where(
        and(
          eq(readStatuses.userId, session.sub),
          eq(readStatuses.entityType, "changelog"),
        ),
      ),
  );

  if (entriesError || readError) return [];

  const readIds = new Set((readEntries || []).map((r) => r.entityId));

  return (entries || []).reverse().map((entry) => ({
    ...entry,
    read: readIds.has(entry.id),
  }));
}

export async function markAllChangelogAsRead() {
  const session = await getSession();
  if (!session) return { ok: false };

  const { data: entries, error: entriesErr } = await safeQuery(
    db.select({ id: changelogEntries.id }).from(changelogEntries),
  );
  if (entriesErr) throw entriesErr;

  const entryIds = (entries || []).map((e) => e.id);

  if (entryIds.length === 0) return { ok: true };

  const { data: alreadyRead, error: readErr } = await safeQuery(
    db
      .select({ entityId: readStatuses.entityId })
      .from(readStatuses)
      .where(
        and(
          eq(readStatuses.userId, session.sub),
          eq(readStatuses.entityType, "changelog"),
        ),
      ),
  );
  if (readErr) throw readErr;

  const alreadyReadIds = (alreadyRead || []).map((r) => r.entityId);
  const unreadIds = entryIds.filter((id) => !alreadyReadIds.includes(id));

  if (unreadIds.length > 0) {
    const values = unreadIds.map((id) => ({
      id: crypto.randomUUID(),
      userId: session.sub,
      entityType: "changelog",
      entityId: id,
      createdAt: new Date(),
    }));

    const { error: insertErr } = await safeQuery(
      db.insert(readStatuses).values(values),
    );
    if (insertErr) throw insertErr;
  }

  revalidatePath("/info");
  revalidatePath("/", "layout"); // Revalidate layout for the nav badge
  return { ok: true };
}

export async function getUnreadChangelogCount() {
  const session = await getSession();
  if (!session) return 0;

  const { data: entries, error: entriesErr } = await safeQuery(
    db.select({ id: changelogEntries.id }).from(changelogEntries),
  );
  if (entriesErr) throw entriesErr;

  const entryIds = (entries || []).map((e) => e.id);

  if (entryIds.length === 0) return 0;

  const { data: alreadyRead, error: readErr } = await safeQuery(
    db
      .select({ entityId: readStatuses.entityId })
      .from(readStatuses)
      .where(
        and(
          eq(readStatuses.userId, session.sub),
          eq(readStatuses.entityType, "changelog"),
        ),
      ),
  );
  if (readErr) throw readErr;

  const alreadyReadIds = new Set((alreadyRead || []).map((r) => r.entityId));
  const unreadCount = entryIds.filter((id) => !alreadyReadIds.has(id)).length;

  return unreadCount;
}
