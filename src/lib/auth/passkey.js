import { phpFetch } from "@/lib/api/phpClient";

/**
 * Registration: Step 1 - Options
 */
export async function getRegistrationOptions(_user) {
  console.log("[lib/auth/passkey] Requesting registration options");
  const result = await phpFetch("/auth/passkey/register/begin", {
    method: "POST",
  });

  if (!result.ok) {
    console.error(
      `[lib/auth/passkey] PHP registration begin failed: ${result.error}`,
    );
    throw new Error(result.error || "Failed to get registration options");
  }

  return result.data;
}

/**
 * Registration: Step 2 - Verify
 */
export async function verifyRegistration(_userId, body, name) {
  console.log("[lib/auth/passkey] Verifying registration");
  const result = await phpFetch("/auth/passkey/register/finish", {
    method: "POST",
    body: {
      ...body,
      name: name || "Passkey",
    },
  });

  if (!result.ok) {
    console.error(
      `[lib/auth/passkey] PHP registration finish failed: ${result.error}`,
    );
    throw new Error(result.error || "Failed to verify registration");
  }

  return result.data;
}

/**
 * Authentication: Step 1 - Options
 */
export async function getAuthenticationOptions() {
  console.log("[lib/auth/passkey] Requesting authentication options");
  const result = await phpFetch("/auth/passkey/login/begin", {
    method: "POST",
    security: [], // Indicates no auth header needed if we wanted to be explicit, but phpFetch handles it
  });

  if (!result.ok) {
    console.error(
      `[lib/auth/passkey] PHP authentication begin failed: ${result.error}`,
    );
    throw new Error(result.error || "Failed to get authentication options");
  }

  return result.data;
}

/**
 * Authentication: Step 2 - Verify
 */
export async function verifyAuthentication(body) {
  console.log("[lib/auth/passkey] Verifying authentication");
  const result = await phpFetch("/auth/passkey/login/finish", {
    method: "POST",
    body,
  });

  if (!result.ok) {
    console.error(
      `[lib/auth/passkey] PHP authentication finish failed: ${result.error}`,
    );
    return { verified: false };
  }

  // result.data contains TokenResponse
  return {
    verified: true,
    user: result.data.user,
    token: result.data.accessToken,
    refreshToken: result.data.refreshToken,
    expiresIn: result.data.expiresIn,
  };
}
