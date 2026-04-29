import crypto from "node:crypto";
import { and, eq, gt, isNull, lt } from "drizzle-orm";
import { SignJWT } from "jose";
import { sendOtpEmail } from "@/lib/auth/email";
import { db } from "@/lib/db/db";
import { otpTokens, users } from "@/lib/db/schema";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

async function purgeExpiredTokens() {
  await db.delete(otpTokens).where(lt(otpTokens.expiresAt, new Date()));
}

export async function requestOtp(email) {
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (!user) return { ok: false, error: "user_not_found" };

  // Invalidate all prior unused tokens for this email
  await db
    .delete(otpTokens)
    .where(and(eq(otpTokens.email, email), isNull(otpTokens.usedAt)));

  // Purge all expired tokens across all users
  await purgeExpiredTokens();

  const code = String(crypto.randomInt(100000, 999999));
  const now = new Date();

  await db.insert(otpTokens).values({
    id: crypto.randomUUID(),
    email,
    code,
    expiresAt: new Date(now.getTime() + 10 * 60 * 1000),
    createdAt: now,
  });

  await sendOtpEmail(email, code).catch((err) => {
    console.error("[OTP] sendOtpEmail failed:", err);
    throw new Error("mail_send_failed");
  });
  return { ok: true };
}

export async function verifyOtp(email, code) {
  const now = new Date();

  const [token] = await db
    .select()
    .from(otpTokens)
    .where(
      and(
        eq(otpTokens.email, email),
        eq(otpTokens.code, code),
        gt(otpTokens.expiresAt, now),
        isNull(otpTokens.usedAt),
      ),
    )
    .limit(1);

  if (!token) return { ok: false, error: "invalid_or_expired" };

  await db
    .update(otpTokens)
    .set({ usedAt: now })
    .where(eq(otpTokens.id, token.id));

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (!user) return { ok: false, error: "user_not_found" };

  const jwt = await new SignJWT({
    sub: user.id,
    email: user.email,
    isAdmin: user.isAdmin,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(secret);

  return {
    ok: true,
    token: jwt,
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      isAdmin: user.isAdmin,
    },
  };
}
