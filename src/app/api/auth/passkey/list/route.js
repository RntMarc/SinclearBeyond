import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { passkeyLimiter } from "@/lib/auth/rateLimiter";
import { getSession } from "@/lib/auth/session";
import { db, safeQuery } from "@/lib/db/db";
import { passkeys } from "@/lib/db/schema";

export async function GET() {
  const t = await getTranslations("Common");
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
  }

  try {
    await passkeyLimiter.consume(session.sub);
  } catch {
    return NextResponse.json({ error: t("tooManyRequests") }, { status: 429 });
  }

  const { data: userPasskeys, error } = await safeQuery(
    db.select().from(passkeys).where(eq(passkeys.userId, session.sub)),
  );

  if (error) throw error;

  return NextResponse.json(userPasskeys || []);
}
