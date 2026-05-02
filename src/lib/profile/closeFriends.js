"use server";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/db";
import { closeFriends, users } from "@/lib/db/schema";

export async function getCloseFriends() {
  const session = await getSession();
  if (!session?.sub) return [];

  const friends = await db
    .select({
      id: users.id,
      displayName: users.displayName,
      image: users.image,
      closeFriendId: closeFriends.id,
    })
    .from(closeFriends)
    .innerJoin(users, eq(closeFriends.friendId, users.id))
    .where(eq(closeFriends.userId, session.sub));

  return friends;
}

export async function addCloseFriend(friendId) {
  const session = await getSession();
  if (!session?.sub) return { ok: false, error: "Nicht angemeldet" };

  if (session.sub === friendId)
    return { ok: false, error: "Man kann sich nicht selbst hinzufügen" };

  try {
    const [existing] = await db
      .select()
      .from(closeFriends)
      .where(
        and(
          eq(closeFriends.userId, session.sub),
          eq(closeFriends.friendId, friendId),
        ),
      )
      .limit(1);

    if (existing) return { ok: true };

    await db.insert(closeFriends).values({
      id: crypto.randomUUID(),
      userId: session.sub,
      friendId: friendId,
      createdAt: new Date(),
    });

    revalidatePath("/einstellungen");
    return { ok: true };
  } catch (error) {
    console.error(error);
    return { ok: false, error: "Fehler beim Hinzufügen" };
  }
}

export async function removeCloseFriend(friendId) {
  const session = await getSession();
  if (!session?.sub) return { ok: false, error: "Nicht angemeldet" };

  try {
    await db
      .delete(closeFriends)
      .where(
        and(
          eq(closeFriends.userId, session.sub),
          eq(closeFriends.friendId, friendId),
        ),
      );

    revalidatePath("/einstellungen");
    return { ok: true };
  } catch (error) {
    console.error(error);
    return { ok: false, error: "Fehler beim Entfernen" };
  }
}
