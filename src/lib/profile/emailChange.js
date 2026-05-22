"use server";
import crypto from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { sendOtpEmail } from "@/lib/auth/email";
import { getSession } from "@/lib/auth/session";
import { db, safeQuery } from "@/lib/db/db";
import { otpTokens, users } from "@/lib/db/schema";

export async function requestEmailChangeOtp(newEmail) {
  const session = await getSession();
  if (!session?.sub) return { ok: false, error: "Nicht angemeldet" };

  // Check if email already in use
  const { data: existingRows, error: checkErr } = await safeQuery(
    db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, newEmail))
      .limit(1),
  );

  if (checkErr) throw checkErr;
  if (existingRows && existingRows.length > 0)
    return { ok: false, error: "E-Mail bereits vergeben" };

  // Invalidate old tokens for this email
  await safeQuery(
    db
      .delete(otpTokens)
      .where(and(eq(otpTokens.email, newEmail), isNull(otpTokens.usedAt))),
  );

  const code = String(crypto.randomInt(100000, 999999));
  const now = new Date();

  const { error: inErr } = await safeQuery(
    db.insert(otpTokens).values({
      id: crypto.randomUUID(),
      email: newEmail,
      code,
      expiresAt: new Date(now.getTime() + 10 * 60 * 1000),
      createdAt: now,
    }),
  );
  if (inErr) throw inErr;

  try {
    await sendOtpEmail(newEmail, code);
    return { ok: true };
  } catch (err) {
    console.error("[OTP] sendOtpEmail failed:", err);
    return { ok: false, error: "E-Mail konnte nicht gesendet werden" };
  }
}

export async function verifyEmailChangeOtp(newEmail, code) {
  const session = await getSession();
  if (!session?.sub) return { ok: false, error: "Nicht angemeldet" };

  const now = new Date();

  const { data: tokens, error: tokenErr } = await safeQuery(
    db
      .select()
      .from(otpTokens)
      .where(
        and(
          eq(otpTokens.email, newEmail),
          eq(otpTokens.code, code),
          gt(otpTokens.expiresAt, now),
          isNull(otpTokens.usedAt),
        ),
      )
      .limit(1),
  );

  if (tokenErr) throw tokenErr;
  const token = tokens?.[0];

  if (!token) return { ok: false, error: "Code ungültig oder abgelaufen" };

  await safeQuery(
    db.update(otpTokens).set({ usedAt: now }).where(eq(otpTokens.id, token.id)),
  );

  // Update user email
  const { error: upErr } = await safeQuery(
    db.update(users).set({ email: newEmail }).where(eq(users.id, session.sub)),
  );
  if (upErr) throw upErr;

  revalidatePath("/einstellungen");
  // Note: Session contains the old email, but sub is ID. Usually session should be refreshed.
  // But for now, we just update the DB.

  return { ok: true };
}
