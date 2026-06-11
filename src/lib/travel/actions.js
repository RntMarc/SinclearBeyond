"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { phpFetch } from "@/lib/api/phpClient";

export async function getUnreadTravelCount() {
  const session = await getSession();
  if (!session) return 0;

  const result = await phpFetch("/notifications/badges");
  if (!result.ok) return 0;
  const badges = result.data.data || {};
  return (badges.trip || 0) + (badges.event || 0);
}

export async function markAllTravelAsRead() {
  const session = await getSession();
  if (!session) return { ok: false };

  await phpFetch("/notifications/read-type", {
    method: "POST",
    body: { type: ["trip", "event"] },
  });

  revalidatePath("/reisen");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function markTravelItemAsRead(itemId, type) {
  const session = await getSession();
  if (!session) return { ok: false };

  await phpFetch("/notifications/read-type", {
    method: "POST",
    body: { type: [type] },
  });

  revalidatePath("/reisen");
  revalidatePath("/", "layout");
  return { ok: true };
}
