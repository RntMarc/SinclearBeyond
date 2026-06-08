import "server-only";
import { cookies } from "next/headers";
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

  // Adapt to the format expected by the rest of the app (sub, email, isAdmin, etc.)
  return {
    sub: user.id,
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    isAdmin: user.isAdmin,
    onboardingCompleted: user.onboardingCompleted,
    image: user.image,
    // Note: theme/language/primaryColor/timezone were previously in the JWT.
    // They might need to be fetched separately if needed globally,
    // or we might need /auth/me to return them.
    // For now, I'll keep them as defaults or try to get them from user-preferences.
  };
}
