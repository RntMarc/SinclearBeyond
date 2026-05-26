"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { db, safeQuery } from "@/lib/db/db";
import { closeFriends, readStatuses, users } from "@/lib/db/schema";

export async function getUnreadBirthdaysCount() {
  const session = await getSession();
  if (!session) return 0;
  const userId = session.sub;

  // For birthdays, "unread" means it's someone's birthday today and we haven't seen the page today.
  // Or maybe more simply: just like the others, we track seen birthdays.
  // But birthdays happen every year. So we might need a more complex entityId like "birthday-userId-year"
  // OR, we just check if there IS a birthday today, and if we have a readStatus for "birthday-today" for today's date.

  const today = new Date();
  const day = today.getDate();
  const month = today.getMonth(); // 0-indexed

  // Get users whose birthday is today and are visible to current user
  const { data: allUsers } = await safeQuery(
    db
      .select({
        id: users.id,
        birthday: users.birthday,
        birthdayVisibility: users.birthdayVisibility,
      })
      .from(users),
  );

  const { data: whoMarkedMe } = await safeQuery(
    db
      .select({ userId: closeFriends.userId })
      .from(closeFriends)
      .where(eq(closeFriends.friendId, userId)),
  );
  const visibilityCloseFriendIds = new Set(
    (whoMarkedMe || []).map((f) => f.userId),
  );

  const birthdayUserIdsToday = (allUsers || [])
    .filter((u) => {
      if (!u.birthday) return false;
      const bday = new Date(u.birthday);
      if (bday.getDate() !== day || bday.getMonth() !== month) return false;

      if (u.id === userId) return true;
      const visibility = u.birthdayVisibility;
      const allowsMePrivateInfo = visibilityCloseFriendIds.has(u.id);
      return visibility === 1 || (visibility === 2 && allowsMePrivateInfo);
    })
    .map((u) => u.id);

  if (birthdayUserIdsToday.length === 0) return 0;

  // entityId will be `birthday-${userId}-${today.getFullYear()}-${month}-${day}`
  const dateStr = `${today.getFullYear()}-${month}-${day}`;
  const unreadCount = [];

  for (const bUserId of birthdayUserIdsToday) {
    const entityId = `birthday-${bUserId}-${dateStr}`;
    const { data: readEntry } = await safeQuery(
      db
        .select()
        .from(readStatuses)
        .where(
          and(
            eq(readStatuses.userId, userId),
            eq(readStatuses.entityType, "birthday"),
            eq(readStatuses.entityId, entityId),
          ),
        ),
    );
    if (!readEntry || readEntry.length === 0) {
      unreadCount.push(bUserId);
    }
  }

  return unreadCount.length;
}

export async function markTodayBirthdaysAsRead() {
  const session = await getSession();
  if (!session) return { ok: false };
  const userId = session.sub;

  const today = new Date();
  const day = today.getDate();
  const month = today.getMonth();
  const dateStr = `${today.getFullYear()}-${month}-${day}`;

  const { data: allUsers } = await safeQuery(
    db
      .select({
        id: users.id,
        birthday: users.birthday,
        birthdayVisibility: users.birthdayVisibility,
      })
      .from(users),
  );

  const { data: whoMarkedMe } = await safeQuery(
    db
      .select({ userId: closeFriends.userId })
      .from(closeFriends)
      .where(eq(closeFriends.friendId, userId)),
  );
  const visibilityCloseFriendIds = new Set(
    (whoMarkedMe || []).map((f) => f.userId),
  );

  const birthdayUserIdsToday = (allUsers || [])
    .filter((u) => {
      if (!u.birthday) return false;
      const bday = new Date(u.birthday);
      if (bday.getDate() !== day || bday.getMonth() !== month) return false;

      if (u.id === userId) return true;
      const visibility = u.birthdayVisibility;
      const allowsMePrivateInfo = visibilityCloseFriendIds.has(u.id);
      return visibility === 1 || (visibility === 2 && allowsMePrivateInfo);
    })
    .map((u) => u.id);

  for (const bUserId of birthdayUserIdsToday) {
    const entityId = `birthday-${bUserId}-${dateStr}`;
    const { data: readEntry } = await safeQuery(
      db
        .select()
        .from(readStatuses)
        .where(
          and(
            eq(readStatuses.userId, userId),
            eq(readStatuses.entityType, "birthday"),
            eq(readStatuses.entityId, entityId),
          ),
        ),
    );
    if (!readEntry || readEntry.length === 0) {
      await safeQuery(
        db.insert(readStatuses).values({
          id: crypto.randomUUID(),
          userId,
          entityType: "birthday",
          entityId,
          createdAt: new Date(),
        }),
      );
    }
  }

  revalidatePath("/geburtstage");
  revalidatePath("/", "layout");
  return { ok: true };
}
