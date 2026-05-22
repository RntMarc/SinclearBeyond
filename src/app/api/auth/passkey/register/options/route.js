import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getRegistrationOptions } from "@/lib/auth/passkey";
import { getSession } from "@/lib/auth/session";
import { db, safeQuery } from "@/lib/db/db";
import { users } from "@/lib/db/schema";

export async function POST() {
  const t = await getTranslations("Common");
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
  }

  const { data: usersData, error: fetchErr } = await safeQuery(
    db.select().from(users).where(eq(users.id, session.sub)).limit(1),
  );
  if (fetchErr) throw fetchErr;

  const user = usersData?.[0];

  if (!user) {
    return NextResponse.json({ error: t("notFound") }, { status: 404 });
  }

  try {
    const options = await getRegistrationOptions(user);
    return NextResponse.json(options);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: t("error") }, { status: 500 });
  }
}
