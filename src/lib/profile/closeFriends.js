"use server";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { phpFetch } from "@/lib/api/phpClient";

export async function getCloseFriends() {
  const session = await getSession();
  if (!session?.sub) return [];

  const result = await phpFetch(`/close-friends/${session.sub}`);

  if (!result.ok) return [];

  return result.data || [];
}

export async function addCloseFriend(friendId) {
  const session = await getSession();
  if (!session?.sub) return { ok: false, error: "Nicht angemeldet" };

  if (session.sub === friendId)
    return { ok: false, error: "Man kann sich nicht selbst hinzufügen" };

  try {
    const result = await phpFetch(`/close-friends/${session.sub}/${friendId}`, {
        method: "POST",
        body: { userId: session.sub, friendId }
    });

    if (!result.ok) throw new Error(result.error);

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
    const result = await phpFetch(`/close-friends/${session.sub}/${friendId}`, {
      method: "DELETE",
    });

    if (!result.ok) throw new Error(result.error);

    revalidatePath("/einstellungen");
    return { ok: true };
  } catch (error) {
    console.error(error);
    return { ok: false, error: "Fehler beim Entfernen" };
  }
}
