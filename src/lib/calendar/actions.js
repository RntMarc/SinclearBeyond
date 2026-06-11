"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { phpFetch } from "@/lib/api/phpClient";

export async function getUnreadCalendarCount() {
  const session = await getSession();
  if (!session) return 0;

  const result = await phpFetch("/notifications/badges");
  if (!result.ok) return 0;
  return result.data.data?.event || 0;
}

export async function markAllCalendarAsRead() {
  const session = await getSession();
  if (!session) return { ok: false };

  await phpFetch("/notifications/read-type", {
    method: "POST",
    body: { type: ["event"] },
  });

  revalidatePath("/kalender");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function markEventAsRead(eventId) {
  const session = await getSession();
  if (!session) return { ok: false };

  await phpFetch("/notifications/read-type", {
    method: "POST",
    body: { type: ["event"] },
  });

  revalidatePath("/kalender");
  revalidatePath("/", "layout");
  return { ok: true };
}
