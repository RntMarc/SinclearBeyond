"use server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { db, safeQuery } from "@/lib/db/db";
import { users } from "@/lib/db/schema";
import { saveProfile } from "@/lib/profile/profile";

export async function completeOnboarding(formData) {
  const session = await getSession();
  if (!session?.sub) return { ok: false, error: "Nicht angemeldet." };

  try {
    // Save profile data first
    const saveResult = await saveProfile(null, formData);
    if (!saveResult.ok) return saveResult;

    // Save language and timezone if they are in formData
    const language = formData.get("language")?.toString();
    const timezone = formData.get("timezone")?.toString();

    if (language || timezone) {
      const { userPreferences } = await import("@/lib/db/schema");
      const prefData = {};
      if (language) prefData.language = language;
      if (timezone) prefData.timezone = timezone;

      const { data: existingPrefs } = await safeQuery(
        db
          .select()
          .from(userPreferences)
          .where(eq(userPreferences.userId, session.sub))
          .limit(1),
      );

      if (existingPrefs && existingPrefs.length > 0) {
        await safeQuery(
          db
            .update(userPreferences)
            .set(prefData)
            .where(eq(userPreferences.userId, session.sub)),
        );
      } else {
        await safeQuery(
          db.insert(userPreferences).values({
            id: crypto.randomUUID(),
            userId: session.sub,
            ...prefData,
          }),
        );
      }
    }

    // Mark onboarding as completed
    const { error } = await safeQuery(
      db
        .update(users)
        .set({ onboardingCompleted: 1 })
        .where(eq(users.id, session.sub)),
    );

    if (error) throw error;

    revalidatePath("/");
    return { ok: true };
  } catch (err) {
    console.error("Onboarding completion failed", err);
    return {
      ok: false,
      error: "Onboarding konnte nicht abgeschlossen werden.",
    };
  }
}
