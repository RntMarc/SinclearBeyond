"use server";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { saveProfile } from "@/lib/profile/profile";
import { phpFetch } from "@/lib/api/phpClient";

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
      const prefData = {};
      if (language) prefData.language = language;
      if (timezone) prefData.timezone = timezone;

      const updatePrefRes = await phpFetch(`/user-preferences/${session.sub}`, {
        method: "PUT",
        body: prefData,
      });

      if (!updatePrefRes.ok) {
          await phpFetch("/user-preferences", {
            method: "POST",
            body: { userId: session.sub, ...prefData },
          });
      }
    }

    // Mark onboarding as completed
    const userUpdateRes = await phpFetch(`/users/${session.sub}`, {
      method: "PUT",
      body: { onboardingCompleted: true },
    });

    if (!userUpdateRes.ok) throw new Error("User update failed");

    // In the new system, session is fetched from /auth/me on each request or as needed.
    // We don't manually recreate a local JWT here anymore.

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
