import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db, safeQuery } from "@/lib/db/db";
import {
  contactInfo,
  socialInfo,
  userPreferences,
  users,
} from "@/lib/db/schema";

export async function POST(req) {
  const session = await getSession();
  if (!session?.sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      language,
      timezone,
      birthday,
      contactValues,
      socialValues,
      visibility,
    } = body;

    const userId = session.sub;

    // 1. Update User (Birthday & Onboarding Status)
    const userUpdate = {
      onboardingCompleted: 1,
    };
    if (birthday) {
      userUpdate.birthday = new Date(birthday);
    }
    if (visibility.birthdayVisibility !== undefined) {
      userUpdate.birthdayVisibility = visibility.birthdayVisibility;
    }

    await safeQuery(
      db.update(users).set(userUpdate).where(eq(users.id, userId)),
    );

    // 2. Update Preferences
    const { data: prefData } = await safeQuery(
      db
        .select()
        .from(userPreferences)
        .where(eq(userPreferences.userId, userId))
        .limit(1),
    );

    if (prefData?.length > 0) {
      await safeQuery(
        db
          .update(userPreferences)
          .set({ language, timezone })
          .where(eq(userPreferences.userId, userId)),
      );
    } else {
      await safeQuery(
        db.insert(userPreferences).values({
          id: crypto.randomUUID(),
          userId,
          language,
          timezone,
          theme: "dark",
          primaryColor: "var(--primary)",
        }),
      );
    }

    // 3. Update Contact Info
    const { data: existingContact } = await safeQuery(
      db
        .select()
        .from(contactInfo)
        .where(eq(contactInfo.userId, userId))
        .limit(1),
    );

    const contactData = {
      discordHandle: contactValues.discordHandle,
      fluxerHandle: contactValues.fluxerHandle,
      signalNumber: contactValues.signalNumber,
      whatsappNumber: contactValues.whatsappNumber,
      discordVisibility: visibility.discordVisibility,
      fluxerVisibility: visibility.fluxerVisibility,
      matrixVisibility: visibility.matrixVisibility,
      signalVisibility: visibility.signalVisibility,
      whatsappVisibility: visibility.whatsappVisibility,
    };

    if (existingContact?.length > 0) {
      await safeQuery(
        db
          .update(contactInfo)
          .set(contactData)
          .where(eq(contactInfo.userId, userId)),
      );
    } else {
      await safeQuery(
        db.insert(contactInfo).values({
          id: crypto.randomUUID(),
          userId,
          ...contactData,
        }),
      );
    }

    // 4. Update Social Info
    const { data: existingSocial } = await safeQuery(
      db
        .select()
        .from(socialInfo)
        .where(eq(socialInfo.userId, userId))
        .limit(1),
    );

    const socialData = {
      unsplashHandle: socialValues.unsplashHandle,
      instagramHandle: socialValues.instagramHandle,
      mastodonHandle: socialValues.mastodonHandle,
      pixelfedHandle: socialValues.pixelfedHandle,
      blueskyHandle: socialValues.blueskyHandle,
      youtubeHandle: socialValues.youtubeHandle,
      twitchHandle: socialValues.twitchHandle,
      unsplashVisibility: visibility.unsplashVisibility,
      instagramVisibility: visibility.instagramVisibility,
      mastodonVisibility: visibility.mastodonVisibility,
      pixelfedVisibility: visibility.pixelfedVisibility,
      blueskyVisibility: visibility.blueskyVisibility,
      youtubeVisibility: visibility.youtubeVisibility,
      twitchVisibility: visibility.twitchVisibility,
    };

    if (existingSocial?.length > 0) {
      await safeQuery(
        db
          .update(socialInfo)
          .set(socialData)
          .where(eq(socialInfo.userId, userId)),
      );
    } else {
      await safeQuery(
        db.insert(socialInfo).values({
          id: crypto.randomUUID(),
          userId,
          ...socialData,
        }),
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Onboarding API error", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
