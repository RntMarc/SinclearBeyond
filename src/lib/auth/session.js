import "server-only";
import { phpFetch } from "@/lib/api/phpClient";

/**
 * Gets the current session by calling the PHP API /auth/me
 */
export async function getSession() {
  const result = await phpFetch("/auth/me");

  if (!result.ok) {
    return null;
  }

  // result.data.data contains the user object
  const user = result.data.data;
  const prefs = user.preferences || {};

  // Adapt to the format expected by the rest of the app
  return {
    sub: user.id,
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    isAdmin: user.isAdmin,
    onboardingCompleted: user.onboardingCompleted,
    image: user.image,
    language: prefs.language || "de",
    theme: prefs.theme || "dark",
    primaryColor: prefs.primaryColor || "#7c3aed",
    timezone: prefs.timezone || null,
  };
}
