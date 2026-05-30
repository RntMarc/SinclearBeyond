"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { db, safeQuery } from "@/lib/db/db";
import { notifications } from "@/lib/db/schema";

export async function getUnreadPollsCount() {
  const session = await getSession();
  if (!session) return 0;
  const userId = session.sub;

  const { data, error } = await safeQuery(
    db
      .select({ id: notifications.id })
      .from(notifications)
      .where(
        and(eq(notifications.userId, userId), eq(notifications.type, "poll")),
      ),
  );

  if (error) return 0;
  return data?.length || 0;
}

export async function markAllPollsAsRead() {
  const session = await getSession();
  if (!session) return { ok: false };
  const userId = session.sub;

  await safeQuery(
    db
      .delete(notifications)
      .where(
        and(eq(notifications.userId, userId), eq(notifications.type, "poll")),
      ),
  );

  revalidatePath("/umfrage");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function markPollAsRead(pollId) {
  const session = await getSession();
  if (!session) return { ok: false };

  await safeQuery(
    db
      .delete(notifications)
      .where(
        and(
          eq(notifications.userId, session.sub),
          eq(notifications.type, "poll"),
          eq(notifications.entityId, pollId),
        ),
      ),
  );

  revalidatePath("/umfrage");
  revalidatePath("/", "layout");
  return { ok: true };
}
