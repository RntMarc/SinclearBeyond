import "server-only";
import { cookies } from "next/headers";
import { phpFetch } from "@/lib/api/phpClient";

/**
 * Gets the current session by calling the PHP API /auth/me
 * Returns null immediately if no access token cookie exists (no API call)
 */
export async function getSession() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  if (!accessToken) {
    return null;
  }

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
