"use server";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { phpFetch } from "@/lib/api/phpClient";

export async function requestEmailChangeOtp(newEmail) {
  const session = await getSession();
  if (!session?.sub) return { ok: false, error: "Nicht angemeldet" };

  // Note: The PHP API should handle existing email check and OTP sending.
  // Assuming a new endpoint or reusing /auth/otp/request if it supports authenticated calls
  // for email change. If not available, we'll document it.

  const result = await phpFetch("/auth/otp/request", {
    method: "POST",
    body: { email: newEmail },
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  return { ok: true };
}

export async function verifyEmailChangeOtp(newEmail, code) {
  const session = await getSession();
  if (!session?.sub) return { ok: false, error: "Nicht angemeldet" };

  // Verify the OTP via PHP API
  const verifyRes = await phpFetch("/auth/otp/verify", {
    method: "POST",
    body: { email: newEmail, code },
  });

  if (!verifyRes.ok) {
    return { ok: false, error: verifyRes.error };
  }

  // If verified, update the user's email in the PHP API
  const updateRes = await phpFetch(`/users/${session.sub}`, {
    method: "PUT",
    body: { email: newEmail },
  });

  if (!updateRes.ok) {
    return { ok: false, error: updateRes.error };
  }

  revalidatePath("/einstellungen");
  return { ok: true };
}
