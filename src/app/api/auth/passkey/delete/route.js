import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth/session";
import { db, safeQuery } from "@/lib/db/db";
import { passkeys } from "@/lib/db/schema";

export async function POST(req) {
  const t = await getTranslations("Common");
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
  }

  try {
    const { id } = await req.json();
    const { error } = await safeQuery(
      db
        .delete(passkeys)
        .where(and(eq(passkeys.id, id), eq(passkeys.userId, session.sub))),
    );
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: t("error") }, { status: 500 });
  }
}
