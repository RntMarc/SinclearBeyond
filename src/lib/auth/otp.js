import { phpFetch } from "@/lib/api/phpClient";

export async function requestOtp(email) {
  const result = await phpFetch("/auth/otp/request", {
    method: "POST",
    body: { email },
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  return { ok: true };
}

export async function verifyOtp(email, code) {
  const result = await phpFetch("/auth/otp/verify", {
    method: "POST",
    body: { email, code },
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  // result.data contains { accessToken, refreshToken, expiresIn, user }
  return {
    ok: true,
    token: result.data.accessToken,
    refreshToken: result.data.refreshToken,
    expiresIn: result.data.expiresIn,
    user: result.data.user,
  };
}
