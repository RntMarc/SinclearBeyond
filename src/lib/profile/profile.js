"use server";
import { revalidatePath } from "next/cache";
import sharp from "sharp";
import { phpFetch } from "@/lib/api/phpClient";

export async function getProfileData(session) {
  if (!session?.sub) return null;

  const [userRes, contactRes, socialRes] = await Promise.all([
    phpFetch(`/users/${session.sub}`),
    phpFetch(`/contact-info/${session.sub}`),
    phpFetch(`/social-info/${session.sub}`),
  ]);

  if (!userRes.ok) return null;

  return {
    user: userRes.data,
    contact: contactRes.ok ? contactRes.data : null,
    social: socialRes.ok ? socialRes.data : null,
  };
}

export async function saveProfile(_prevState, formData) {
  const session = await (await import("@/lib/auth/session")).getSession();
  if (!session?.sub) return { ok: false, error: "Nicht angemeldet." };

  try {
    const displayName = formData.get("displayName")?.toString().trim();
    const birthday = formData.get("birthday")?.toString() || null;

    const discord = formData.get("discordHandle")?.toString().trim() || null;
    const fluxer = formData.get("fluxerHandle")?.toString().trim() || null;
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
    const emailVis = clamp(formData.get("emailVisibility"));
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

    const userUpdate = {
      birthdayVisibility: birthdayVis,
      emailVisibility: emailVis,
    };
    if (displayName) userUpdate.displayName = displayName;
    if (birthday) {
      userUpdate.birthday = birthday;
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

    const userUpdateRes = await phpFetch(`/users/${session.sub}`, {
      method: "PUT",
      body: userUpdate,
    });
    if (!userUpdateRes.ok) throw new Error("User update failed");

    const contactData = {
      discordHandle: discord,
      fluxerHandle: fluxer,
      signalNumber: signal,
      whatsappNumber: whatsapp,
      discordVisibility: discordVis,
      fluxerVisibility: fluxerVis,
      matrixVisibility: matrixVis,
      signalVisibility: signalVis,
      whatsappVisibility: whatsappVis,
    };

    const contactUpdateRes = await phpFetch(`/contact-info/${session.sub}`, {
      method: "PUT",
      body: contactData,
    });
    if (!contactUpdateRes.ok) {
      await phpFetch("/contact-info", {
        method: "POST",
        body: { id: session.sub, ...contactData }, // Changed userId to id as per param {id} in POST path
      });
    }

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

    const socialUpdateRes = await phpFetch(`/social-info/${session.sub}`, {
      method: "PUT",
      body: socialData,
    });
    if (!socialUpdateRes.ok) {
      await phpFetch("/social-info", {
        method: "POST",
        body: { id: session.sub, ...socialData },
      });
    }

    revalidatePath("/einstellungen");
    return { ok: true };
  } catch (error) {
    console.error("[Profile] Save failed:", error);
    return { ok: false, error: "Speichern fehlgeschlagen." };
  }
}
