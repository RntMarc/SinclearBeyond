"use server";

import { and, eq, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { db, safeQuery } from "@/lib/db/db";
import { notifications } from "@/lib/db/schema";

export async function getUnreadTravelCount() {
  const session = await getSession();
  if (!session) return 0;
  const userId = session.sub;

  const { data, error } = await safeQuery(
    db
      .select({ id: notifications.id })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          or(eq(notifications.type, "trip"), eq(notifications.type, "event")),
        ),
      ),
  );

  if (error) return 0;
  return data?.length || 0;
}

export async function markAllTravelAsRead() {
  const session = await getSession();
  if (!session) return { ok: false };
  const userId = session.sub;

  await safeQuery(
    db
      .delete(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          or(eq(notifications.type, "trip"), eq(notifications.type, "event")),
        ),
      ),
  );

  revalidatePath("/reisen");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function markTravelItemAsRead(itemId, type) {
  const session = await getSession();
  if (!session) return { ok: false };

  await safeQuery(
    db
      .delete(notifications)
      .where(
        and(
          eq(notifications.userId, session.sub),
          eq(notifications.type, type),
          eq(notifications.entityId, itemId),
        ),
      ),
  );

  revalidatePath("/reisen");
  revalidatePath("/", "layout");
  return { ok: true };
}
