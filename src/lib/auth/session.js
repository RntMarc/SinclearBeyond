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
  const refreshToken = cookieStore.get("refreshToken")?.value;

  if (process.env.NODE_ENV !== "production") {
    console.log(`[getSession] accessToken present: ${!!accessToken}, refreshToken present: ${!!refreshToken}`);
    if (accessToken) {
      console.log(`[getSession] accessToken preview: ${accessToken.substring(0, 20)}...`);
    }
  }

  if (!accessToken) {
    if (process.env.NODE_ENV !== "production") {
      console.log("[getSession] No access token, returning null");
    }
    return null;
  }

  const result = await phpFetch("/auth/me");

  if (!result.ok) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[getSession] phpFetch failed:", result.error, "status:", result.status);
    }
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
