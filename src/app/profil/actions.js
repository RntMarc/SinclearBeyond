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

export async function saveProfile(prevState, formData) {
  const session = await getSession();
  if (!session?.sub) return { ok: false, error: "Nicht angemeldet." };

  try {
    const displayName = formData.get("displayName")?.toString().trim();

    const discord  = formData.get("discordHandle")?.toString().trim()  || null;
    const fluxer   = formData.get("fluxerHandle")?.toString().trim()   || null;
    const matrix   = formData.get("matrixHandle")?.toString().trim()   || null;
    const signal   = formData.get("signalNumber")?.toString().trim()   || null;
    const whatsapp = formData.get("whatsappNumber")?.toString().trim() || null;

    const clamp = (v) => { const n = Number(v); return [0, 1, 2].includes(n) ? n : 1; };
    const discordVis  = clamp(formData.get("discordVisibility"));
    const fluxerVis   = clamp(formData.get("fluxerVisibility"));
    const matrixVis   = clamp(formData.get("matrixVisibility"));
    const signalVis   = clamp(formData.get("signalVisibility"));
    const whatsappVis = clamp(formData.get("whatsappVisibility"));

    if (displayName) {
      await db.update(users).set({ displayName }).where(eq(users.id, session.sub));
    }

    const [existing] = await db
      .select({ id: contactInfo.id })
      .from(contactInfo)
      .where(eq(contactInfo.userId, session.sub))
      .limit(1);

    const contactData = {
      discordHandle:  discord,
      fluxerHandle:   fluxer,
      matrixHandle:   matrix,
      signalNumber:   signal,
      whatsappNumber: whatsapp,
      discordVisibility:  discordVis,
      fluxerVisibility:   fluxerVis,
      matrixVisibility:   matrixVis,
      signalVisibility:   signalVis,
      whatsappVisibility: whatsappVis,
    };

    if (existing) {
      await db.update(contactInfo).set(contactData).where(eq(contactInfo.id, existing.id));
    } else {
      await db.insert(contactInfo).values({
        id: crypto.randomUUID(),
        userId: session.sub,
        ...contactData,
      });
    }

    revalidatePath("/profil");
    return { ok: true };
  } catch {
    return { ok: false, error: "Speichern fehlgeschlagen." };
  }
}
