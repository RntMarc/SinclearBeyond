"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { phpFetch } from "@/lib/api/phpClient";
import { sendNotification } from "@/lib/notifications/service";

export async function createChangelogEntry(data) {
  const session = await getSession();
  if (!session?.isAdmin) {
    throw new Error("Unauthorized");
  }

  const id = crypto.randomUUID();

  const result = await phpFetch("/changelog", {
    method: "POST",
    body: {
      id,
      title: data.title,
      content: data.content,
      category: data.category,
      createdAt: new Date().toISOString(),
    },
  });

  if (!result.ok) throw new Error("Failed to create changelog entry");

  // Notify all users about new changelog entry
  try {
    const usersResult = await phpFetch("/users");
    const allUsers = usersResult.ok ? (usersResult.data?.data || usersResult.data || []) : [];

    if (allUsers.length > 0) {
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
  } catch (notifyError) {
    console.error("[Changelog] Notification Error:", notifyError);
  }

  revalidatePath("/info");
  return { ok: true };
}

export async function getChangelogEntries() {
  const session = await getSession();
  if (!session) return [];

  const result = await phpFetch("/changelog");
  const entries = result.ok ? (result.data?.data || []) : [];

  const notifResult = await phpFetch("/notifications");
  const userNotifications = notifResult.ok ? (notifResult.data?.data || []) : [];
  const unreadIds = new Set(
    userNotifications
      .filter((n) => n.type === "changelog")
      .map((n) => n.entityId),
  );

  return entries.reverse().map((entry) => ({
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
