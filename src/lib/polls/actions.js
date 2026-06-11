"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { phpFetch } from "@/lib/api/phpClient";

export async function getUnreadPollsCount() {
  const session = await getSession();
  if (!session) return 0;

  const result = await phpFetch("/notifications/badges");
  if (!result.ok) return 0;
  return result.data.data?.poll || 0;
}

export async function markAllPollsAsRead() {
  const session = await getSession();
  if (!session) return { ok: false };

  await phpFetch("/notifications/read-type", {
    method: "POST",
    body: { type: ["poll"] },
  });

  revalidatePath("/umfrage");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function markPollAsRead(pollId) {
  const session = await getSession();
  if (!session) return { ok: false };

  await phpFetch("/notifications/read-type", {
    method: "POST",
    body: { type: ["poll"] },
  });

  revalidatePath("/umfrage");
  revalidatePath("/", "layout");
  return { ok: true };
}
