"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { phpFetch } from "@/lib/api/phpClient";

export async function getUnreadBirthdaysCount() {
  const session = await getSession();
  if (!session) return 0;

  // Birthdays unread count should be part of global notifications/badges
  const result = await phpFetch("/notifications/badges");
  if (!result.ok) return 0;

  // Assuming the API returns something like { data: { birthdays: 5 } }
  return result.data.data?.birthdays || 0;
}

export async function markAllBirthdaysAsRead() {
  const session = await getSession();
  if (!session) return { ok: false };

  // Use a generic notifications endpoint to mark by type
  await phpFetch("/notifications/read-type", {
    method: "POST",
    body: { type: ["birthday", "birthday_soon"] },
  });

  revalidatePath("/geburtstage");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function markBirthdayAsRead(notificationId) {
  const session = await getSession();
  if (!session) return { ok: false };

  await phpFetch(`/notifications/${notificationId}`, {
    method: "DELETE",
  });

  revalidatePath("/geburtstage");
  revalidatePath("/", "layout");
  return { ok: true };
}
