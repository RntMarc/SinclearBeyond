import { phpFetch } from "@/lib/api/phpClient";

export async function loginUser(email, password) {
  // The PHP API doesn't seem to have a direct email/password login in the OpenAPI spec,
  // only OTP and Passkey. If it's missing, I should add it to MISSING_API_ENDPOINT.md.
  // Assuming for now we might need it, or we rely on OTP/Passkey.

  const result = await phpFetch("/auth/login", {
    method: "POST",
    body: { email, password },
  });

  if (!result.ok) return null;

  return {
    token: result.data.accessToken,
    refreshToken: result.data.refreshToken,
    expiresIn: result.data.expiresIn,
    user: result.data.user,
  };
}

export async function verifyToken(token) {
  // In the new system, we verify by calling /auth/me with the token
  // However, this function is used by verifyToken(token) which might be called in middleware
  // We'll keep it for now but it might be deprecated by phpFetch's internal handling
  const result = await phpFetch("/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!result.ok) throw new Error("Invalid token");
  return result.data.data;
}

export async function createSessionToken(user) {
  // This was used to create local JWTs.
  // In the new system, tokens come from the PHP API.
  // This function is likely deprecated.
  console.warn(
    "createSessionToken is deprecated. Tokens should come from PHP API.",
  );
  return null;
}
