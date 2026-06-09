import { phpFetch } from "@/lib/api/phpClient";

export async function loginUser(email, password) {
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
  const result = await phpFetch("/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!result.ok) throw new Error("Invalid token");
  return result.data.data;
}

/**
 * @deprecated Tokens should come from PHP API.
 */
export async function createSessionToken(user) {
  console.warn(
    "createSessionToken is deprecated. Tokens should come from PHP API.",
  );
  return null;
}
