import { eq } from "drizzle-orm";
import { SignJWT } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/db";
import { userPreferences } from "@/lib/db/schema";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export async function GET() {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [prefs] = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, session.sub))
    .limit(1);

  return NextResponse.json(prefs || { theme: "dark", primaryColor: "#7c3aed" });
}

export async function POST(req) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { theme, primaryColor, language } = await req.json();

  const [existing] = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, session.sub))
    .limit(1);

  if (existing) {
    await db
      .update(userPreferences)
      .set({
        theme: theme ?? existing.theme,
        primaryColor: primaryColor ?? existing.primaryColor,
        language: language ?? existing.language,
      })
      .where(eq(userPreferences.userId, session.sub));
  } else {
    await db.insert(userPreferences).values({
      id: crypto.randomUUID(),
      userId: session.sub,
      theme: theme ?? "dark",
      primaryColor: primaryColor ?? "#7c3aed",
      language: language ?? "de",
    });
  }

  // Update JWT session cookie
  const newToken = await new SignJWT({
    ...session,
    theme: theme ?? session.theme,
    primaryColor: primaryColor ?? session.primaryColor,
    language: language ?? session.language,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(secret);

  const cookieStore = await cookies();
  cookieStore.set("session", newToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  return NextResponse.json({ success: true });
}
