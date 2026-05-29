import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { jwtVerify, SignJWT } from "jose";
import { db, safeQuery } from "@/lib/db/db";
import { userPreferences, users } from "@/lib/db/schema";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export async function loginUser(email, password) {
  const { data: usersData, error } = await safeQuery(
    db.select().from(users).where(eq(users.email, email)).limit(1),
  );
  if (error) throw error;
  const user = usersData?.[0];

  if (!user) return null;

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;

  const token = await createSessionToken(user);

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      isAdmin: user.isAdmin,
    },
  };
}

export async function verifyToken(token) {
  const { payload } = await jwtVerify(token, secret);
  return payload;
}

export async function createSessionToken(user) {
  const { data: prefsData } = await safeQuery(
    db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, user.id))
      .limit(1),
  );

  const prefs = prefsData?.[0];

  return await new SignJWT({
    sub: user.id,
    email: user.email,
    isAdmin: user.isAdmin,
    onboardingCompleted: user.onboardingCompleted,
    language: prefs?.language || "de",
    theme: prefs?.theme || "dark",
    primaryColor: prefs?.primaryColor || "#7c3aed",
    timezone: prefs?.timezone || null,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(secret);
}
