import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { requestOtp } from "@/lib/auth/otp";
import { db, safeQuery } from "@/lib/db/db";
import { users } from "@/lib/db/schema";

function getAllowedDomains() {
  return (process.env.ALLOWED_EMAIL_DOMAINS ?? "")
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
}

export function isDomainAllowed(email) {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return false;
  return getAllowedDomains().includes(domain);
}

export async function registerUser(email, displayName) {
  if (!isDomainAllowed(email)) {
    return { ok: false, error: "domain_not_allowed" };
  }

  const { data: existingRows, error: checkErr } = await safeQuery(
    db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1),
  );

  if (checkErr) throw checkErr;
  if (existingRows && existingRows.length > 0)
    return { ok: false, error: "email_taken" };

  // OTP-only auth — passwordHash unusable intentionally
  const unusableHash = await bcrypt.hash(crypto.randomUUID(), 10);

  const { error: inErr } = await safeQuery(
    db.insert(users).values({
      id: crypto.randomUUID(),
      email,
      displayName: displayName.trim(),
      passwordHash: unusableHash,
      createdAt: new Date(),
    }),
  );
  if (inErr) throw inErr;

  // Send OTP immediately so user lands on verify step
  return await requestOtp(email);
}
