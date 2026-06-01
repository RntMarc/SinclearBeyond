"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { db, safeQuery } from "@/lib/db/db";
import { changelogEntries, notifications, users } from "@/lib/db/schema";
import { sendNotification } from "@/lib/notifications/service";

export async function createChangelogEntry(data) {
  const session = await getSession();
  if (!session?.isAdmin) {
    throw new Error("Unauthorized");
  }

  const id = crypto.randomUUID();
  const now = new Date();
  const { error } = await safeQuery(
    db.insert(changelogEntries).values({
      id,
      title: data.title,
      content: data.content,
      category: data.category,
      createdAt: now,
    }),
  );

  if (error) throw error;

  // Notify all users about new changelog entry
  const { data: allUsers } = await safeQuery(
    db.select({ id: users.id }).from(users),
  );
  if (allUsers && allUsers.length > 0) {
    const targetUserIds = allUsers
      .filter((u) => u.id !== session.sub)
      .map((u) => u.id);

    if (targetUserIds.length > 0) {
      await sendNotification({
        userIds: targetUserIds,
        type: "changelog",
        entityId: id,
        title: "Neuer Changelog-Eintrag",
        body: data.title || "Ein neuer Changelog-Eintrag wurde veröffentlicht",
        link: "/info",
        tag: `changelog-${id}`,
      });
    }
  }

  revalidatePath("/info");
  return { ok: true };
}

export async function getChangelogEntries() {
  const session = await getSession();
  if (!session) return [];

  const { data: entries, error: entriesError } = await safeQuery(
    db.select().from(changelogEntries).orderBy(changelogEntries.createdAt),
  );

  const { data: notificationEntries, error: readError } = await safeQuery(
    db
      .select({ entityId: notifications.entityId })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, session.sub),
          eq(notifications.type, "changelog"),
        ),
      ),
  );

  if (entriesError || readError) return [];

  const unreadIds = new Set((notificationEntries || []).map((n) => n.entityId));

  return (entries || []).reverse().map((entry) => ({
    ...entry,
    read: !unreadIds.has(entry.id),
  }));
}

export async function markAllChangelogAsRead() {
  const session = await getSession();
  if (!session) return { ok: false };

  await safeQuery(
    db
      .delete(notifications)
      .where(
        and(
          eq(notifications.userId, session.sub),
          eq(notifications.type, "changelog"),
        ),
      ),
  );

  revalidatePath("/info");
  revalidatePath("/", "layout"); // Revalidate layout for the nav badge
  return { ok: true };
}

export async function markChangelogAsRead(id) {
  const session = await getSession();
  if (!session) return { ok: false };

  await safeQuery(
    db
      .delete(notifications)
      .where(
        and(
          eq(notifications.userId, session.sub),
          eq(notifications.type, "changelog"),
          eq(notifications.entityId, id),
        ),
      ),
  );

  revalidatePath("/info");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function getUnreadChangelogCount() {
  const session = await getSession();
  if (!session) return 0;

  const { data, error } = await safeQuery(
    db
      .select({ id: notifications.id })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, session.sub),
          eq(notifications.type, "changelog"),
        ),
      ),
  );

  if (error) return 0;
  return data?.length || 0;
}
