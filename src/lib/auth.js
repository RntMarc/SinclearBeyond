import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export async function loginUser(email, password) {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user) return null;

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;

  const token = await new SignJWT({ sub: user.id, email: user.email })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(secret);

  return { token, user: { id: user.id, email: user.email, displayName: user.displayName } };
}

export async function verifyToken(token) {
  const { payload } = await jwtVerify(token, secret);
  return payload;
}
