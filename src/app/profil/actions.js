"use server";
import { db } from "@/lib/db/db";
import { users, contactInfo } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";

export async function getProfileData() {
  const session = await getSession();
  if (!session?.sub) return null;

  const [user] = await db
    .select({ displayName: users.displayName, email: users.email, createdAt: users.createdAt })
    .from(users)
    .where(eq(users.id, session.sub))
    .limit(1);

  const [contact] = await db
    .select()
    .from(contactInfo)
    .where(eq(contactInfo.userId, session.sub))
    .limit(1);

  return { user, contact: contact ?? null };
}

export async function saveProfile(formData) {
  const session = await getSession();
  if (!session?.sub) throw new Error("Unauthenticated");

  const displayName = formData.get("displayName")?.toString().trim();
  const discord     = formData.get("discordHandle")?.toString().trim()  || null;
  const fluxer      = formData.get("fluxerHandle")?.toString().trim()   || null;
  const matrix      = formData.get("matrixHandle")?.toString().trim()   || null;
  const signal      = formData.get("signalNumber")?.toString().trim()   || null;
  const whatsapp    = formData.get("whatsappNumber")?.toString().trim() || null;

  if (displayName) {
    await db
      .update(users)
      .set({ displayName })
      .where(eq(users.id, session.sub))
  }

  const [existing] = await db
    .select({ id: contactInfo.id })
    .from(contactInfo)
    .where(eq(contactInfo.userId, session.sub))
    .limit(1);

  if (existing) {
    await db
      .update(contactInfo)
      .set({ discordHandle: discord, fluxerHandle: fluxer, matrixHandle: matrix, signalNumber: signal, whatsappNumber: whatsapp })
      .where(eq(contactInfo.id, existing.id));
  } else {
    await db.insert(contactInfo).values({
      id:             crypto.randomUUID(),
      userId:         session.sub,
      discordHandle:  discord,
      fluxerHandle:   fluxer,
      matrixHandle:   matrix,
      signalNumber:   signal,
      whatsappNumber: whatsapp,
    });
  }

  revalidatePath("/profil");
}
