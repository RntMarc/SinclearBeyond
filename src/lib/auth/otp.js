import { phpFetch } from "@/lib/api/phpClient";

export async function requestOtp(email) {
  console.log(`[lib/auth/otp] Requesting OTP for ${email}`);
  const result = await phpFetch("/auth/otp/request", {
    method: "POST",
    body: { email },
  });

  if (!result.ok) {
    console.error(`[lib/auth/otp] PHP OTP Request failed: ${result.error}`);
    return { ok: false, error: result.error };
  }

  return { ok: true };
}

export async function verifyOtp(email, code) {
  console.log(`[lib/auth/otp] Verifying OTP for ${email}`);
  const result = await phpFetch("/auth/otp/verify", {
    method: "POST",
    body: { email, code },
  });

  if (!result.ok) {
    console.error(`[lib/auth/otp] PHP OTP Verify failed: ${result.error}`);
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
