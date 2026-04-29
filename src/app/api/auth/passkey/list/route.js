import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/db";
import { passkeys } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userPasskeys = await db
    .select()
    .from(passkeys)
    .where(eq(passkeys.userId, session.sub));

  return NextResponse.json(userPasskeys);
}
