"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { db, safeQuery } from "@/lib/db/db";
import { changelogEntries, users } from "@/lib/db/schema";
import { phpFetch } from "@/lib/api/phpClient";
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

  const notifResult = await phpFetch("/notifications");
  const userNotifications = notifResult.ok ? (notifResult.data?.data || []) : [];
  const unreadIds = new Set(
    userNotifications
      .filter((n) => n.type === "changelog")
      .map((n) => n.entityId),
  );

  if (entriesError) return [];

  return (entries || []).reverse().map((entry) => ({
    ...entry,
    read: !unreadIds.has(entry.id),
  }));
}

export async function markAllChangelogAsRead() {
  const session = await getSession();
  if (!session) return { ok: false };

  await phpFetch("/notifications/read-type", {
    method: "POST",
    body: { type: ["changelog"] },
  });

  revalidatePath("/info");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function markChangelogAsRead(id) {
  const session = await getSession();
  if (!session) return { ok: false };

  await phpFetch("/notifications/read-type", {
    method: "POST",
    body: { type: ["changelog"] },
  });

  revalidatePath("/info");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function getUnreadChangelogCount() {
  const session = await getSession();
  if (!session) return 0;

  const result = await phpFetch("/notifications/badges");
  if (!result.ok) return 0;
  return result.data.data?.changelog || 0;
}
