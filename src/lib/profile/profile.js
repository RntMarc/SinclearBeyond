"use server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import sharp from "sharp";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/db";
import { contactInfo, socialInfo, users } from "@/lib/db/schema";

export async function getProfileData(session) {
  if (!session?.sub) return null;

  const [user] = await db
    .select({
      id: users.id,
      displayName: users.displayName,
      email: users.email,
      birthday: users.birthday,
      birthdayVisibility: users.birthdayVisibility,
      discordId: users.discordId,
      davToken: users.davToken,
      image: users.image,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, session.sub))
    .limit(1);

  const [contact] = await db
    .select()
    .from(contactInfo)
    .where(eq(contactInfo.userId, session.sub))
    .limit(1);

  const [social] = await db
    .select()
    .from(socialInfo)
    .where(eq(socialInfo.userId, session.sub))
    .limit(1);

  return { user, contact: contact ?? null, social: social ?? null };
}

export async function saveProfile(_prevState, formData) {
  const session = await getSession();
  if (!session?.sub) return { ok: false, error: "Nicht angemeldet." };

  try {
    const displayName = formData.get("displayName")?.toString().trim();
    const birthday = formData.get("birthday")?.toString() || null;

    const discord = formData.get("discordHandle")?.toString().trim() || null;
    const fluxer = formData.get("fluxerHandle")?.toString().trim() || null;
    const matrix = formData.get("matrixHandle")?.toString().trim() || null;
    const signal = formData.get("signalNumber")?.toString().trim() || null;
    const whatsapp = formData.get("whatsappNumber")?.toString().trim() || null;

    const unsplash = formData.get("unsplashHandle")?.toString().trim() || null;
    const instagram =
      formData.get("instagramHandle")?.toString().trim() || null;
    const mastodon = formData.get("mastodonHandle")?.toString().trim() || null;
    const pixelfed = formData.get("pixelfedHandle")?.toString().trim() || null;
    const bluesky = formData.get("blueskyHandle")?.toString().trim() || null;
    const youtube = formData.get("youtubeHandle")?.toString().trim() || null;
    const twitch = formData.get("twitchHandle")?.toString().trim() || null;

    const clamp = (v) => {
      const n = Number(v);
      return [0, 1, 2].includes(n) ? n : 1;
    };
    const birthdayVis = clamp(formData.get("birthdayVisibility"));
    const discordVis = clamp(formData.get("discordVisibility"));
    const fluxerVis = clamp(formData.get("fluxerVisibility"));
    const matrixVis = clamp(formData.get("matrixVisibility"));
    const signalVis = clamp(formData.get("signalVisibility"));
    const whatsappVis = clamp(formData.get("whatsappVisibility"));

    const unsplashVis = clamp(formData.get("unsplashVisibility"));
    const instagramVis = clamp(formData.get("instagramVisibility"));
    const mastodonVis = clamp(formData.get("mastodonVisibility"));
    const pixelfedVis = clamp(formData.get("pixelfedVisibility"));
    const blueskyVis = clamp(formData.get("blueskyVisibility"));
    const youtubeVis = clamp(formData.get("youtubeVisibility"));
    const twitchVis = clamp(formData.get("twitchVisibility"));

    const userUpdate = { birthdayVisibility: birthdayVis };
    if (displayName) userUpdate.displayName = displayName;
    if (birthday) {
      userUpdate.birthday = new Date(birthday);
    } else {
      userUpdate.birthday = null;
    }

    const removeImage = formData.get("removeImage") === "true";
    const imageFile = formData.get("image");

    if (removeImage) {
      userUpdate.image = null;
    } else if (imageFile && imageFile.size > 0) {
      const buffer = await imageFile.arrayBuffer();
      const processedBuffer = await sharp(Buffer.from(buffer))
        .resize(265, 265)
        .jpeg({ quality: 70 })
        .toBuffer();
      userUpdate.image = `data:image/jpeg;base64,${processedBuffer.toString("base64")}`;
    }

    await db.update(users).set(userUpdate).where(eq(users.id, session.sub));

    const [existing] = await db
      .select()
      .from(contactInfo)
      .where(eq(contactInfo.userId, session.sub))
      .limit(1);

    const [user] = await db
      .select({ discordId: users.discordId })
      .from(users)
      .where(eq(users.id, session.sub))
      .limit(1);

    const contactData = {
      discordHandle: user?.discordId ? existing?.discordHandle : discord,
      fluxerHandle: fluxer,
      matrixHandle: matrix,
      signalNumber: signal,
      whatsappNumber: whatsapp,
      discordVisibility: discordVis,
      fluxerVisibility: fluxerVis,
      matrixVisibility: matrixVis,
      signalVisibility: signalVis,
      whatsappVisibility: whatsappVis,
    };

    if (existing) {
      await db
        .update(contactInfo)
        .set(contactData)
        .where(eq(contactInfo.id, existing.id));
    } else {
      await db.insert(contactInfo).values({
        id: crypto.randomUUID(),
        userId: session.sub,
        ...contactData,
      });
    }

    const [existingSocial] = await db
      .select({ id: socialInfo.id })
      .from(socialInfo)
      .where(eq(socialInfo.userId, session.sub))
      .limit(1);

    const socialData = {
      unsplashHandle: unsplash,
      instagramHandle: instagram,
      mastodonHandle: mastodon,
      pixelfedHandle: pixelfed,
      blueskyHandle: bluesky,
      youtubeHandle: youtube,
      twitchHandle: twitch,
      unsplashVisibility: unsplashVis,
      instagramVisibility: instagramVis,
      mastodonVisibility: mastodonVis,
      pixelfedVisibility: pixelfedVis,
      blueskyVisibility: blueskyVis,
      youtubeVisibility: youtubeVis,
      twitchVisibility: twitchVis,
    };

    if (existingSocial) {
      await db
        .update(socialInfo)
        .set(socialData)
        .where(eq(socialInfo.id, existingSocial.id));
    } else {
      await db.insert(socialInfo).values({
        id: crypto.randomUUID(),
        userId: session.sub,
        ...socialData,
      });
    }

    revalidatePath("/einstellungen");
    return { ok: true };
  } catch {
    return { ok: false, error: "Speichern fehlgeschlagen." };
  }
}

export async function generateDavToken() {
  const session = await getSession();
  if (!session?.sub) return { ok: false, error: "Nicht angemeldet." };

  try {
    const newToken = crypto.randomUUID().replace(/-/g, "");
    await db
      .update(users)
      .set({ davToken: newToken })
      .where(eq(users.id, session.sub));

    revalidatePath("/profil");
    return { ok: true, token: newToken };
  } catch {
    return { ok: false, error: "Token-Generierung fehlgeschlagen." };
  }
}
