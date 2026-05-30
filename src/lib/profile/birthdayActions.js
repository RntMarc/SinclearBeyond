"use server";

import { and, eq, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { db, safeQuery } from "@/lib/db/db";
import { notifications } from "@/lib/db/schema";

export async function getUnreadBirthdaysCount() {
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
          or(
            eq(notifications.type, "birthday"),
            eq(notifications.type, "birthday_soon"),
          ),
        ),
      ),
  );

  if (error) return 0;
  return data?.length || 0;
}

export async function markAllBirthdaysAsRead() {
  const session = await getSession();
  if (!session) return { ok: false };
  const userId = session.sub;

  await safeQuery(
    db
      .delete(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          or(
            eq(notifications.type, "birthday"),
            eq(notifications.type, "birthday_soon"),
          ),
        ),
      ),
  );

  revalidatePath("/geburtstage");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function markBirthdayAsRead(notificationId) {
  const session = await getSession();
  if (!session) return { ok: false };

  await safeQuery(
    db
      .delete(notifications)
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, session.sub),
        ),
      ),
  );

  revalidatePath("/geburtstage");
  revalidatePath("/", "layout");
  return { ok: true };
}
