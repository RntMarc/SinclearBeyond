"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/db";
import { changelogEntries, readStatuses } from "@/lib/db/schema";

export async function createChangelogEntry(data) {
  const session = await getSession();
  if (!session?.isAdmin) {
    throw new Error("Unauthorized");
  }

  const id = crypto.randomUUID();
  await db.insert(changelogEntries).values({
    id,
    title: data.title,
    content: data.content,
    category: data.category,
    createdAt: new Date(),
  });

  revalidatePath("/info");
  return { ok: true };
}

export async function getChangelogEntries() {
  const session = await getSession();
  if (!session) return [];

  const entries = await db
    .select()
    .from(changelogEntries)
    .orderBy(changelogEntries.createdAt);

  const readEntries = await db
    .select()
    .from(readStatuses)
    .where(
      and(
        eq(readStatuses.userId, session.sub),
        eq(readStatuses.entityType, "changelog"),
      ),
    );

  const readIds = new Set(readEntries.map((r) => r.entityId));

  return entries.reverse().map((entry) => ({
    ...entry,
    read: readIds.has(entry.id),
  }));
}

export async function markAllChangelogAsRead() {
  const session = await getSession();
  if (!session) return { ok: false };

  const entries = await db
    .select({ id: changelogEntries.id })
    .from(changelogEntries);
  const entryIds = entries.map((e) => e.id);

  if (entryIds.length === 0) return { ok: true };

  const alreadyRead = await db
    .select({ entityId: readStatuses.entityId })
    .from(readStatuses)
    .where(
      and(
        eq(readStatuses.userId, session.sub),
        eq(readStatuses.entityType, "changelog"),
      ),
    );

  const alreadyReadIds = alreadyRead.map((r) => r.entityId);
  const unreadIds = entryIds.filter((id) => !alreadyReadIds.includes(id));

  if (unreadIds.length > 0) {
    const values = unreadIds.map((id) => ({
      id: crypto.randomUUID(),
      userId: session.sub,
      entityType: "changelog",
      entityId: id,
      createdAt: new Date(),
    }));

    await db.insert(readStatuses).values(values);
  }

  revalidatePath("/info");
  revalidatePath("/", "layout"); // Revalidate layout for the nav badge
  return { ok: true };
}

export async function getUnreadChangelogCount() {
  const session = await getSession();
  if (!session) return 0;

  const entries = await db
    .select({ id: changelogEntries.id })
    .from(changelogEntries);
  const entryIds = entries.map((e) => e.id);

  if (entryIds.length === 0) return 0;

  const alreadyRead = await db
    .select({ entityId: readStatuses.entityId })
    .from(readStatuses)
    .where(
      and(
        eq(readStatuses.userId, session.sub),
        eq(readStatuses.entityType, "changelog"),
      ),
    );

  const alreadyReadIds = new Set(alreadyRead.map((r) => r.entityId));
  const unreadCount = entryIds.filter((id) => !alreadyReadIds.has(id)).length;

  return unreadCount;
}
