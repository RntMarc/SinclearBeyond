import { phpFetch } from "@/lib/api/phpClient";

export async function registerUser(email, displayName) {
  // Use PHP API to create user
  const result = await phpFetch("/users", {
    method: "POST",
    body: { email, displayName },
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  // Use the new OTP request (already migrated to PHP API)
  const { requestOtp } = await import("@/lib/auth/otp");
  return await requestOtp(email);
}
