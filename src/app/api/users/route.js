import { and, like, ne, or } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/db";
import { users } from "@/lib/db/schema";

export async function GET(req) {
  const t = await getTranslations("Common");
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: t("unauthorized") }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search");

  let query = db
    .select({
      id: users.id,
      displayName: users.displayName,
      email: users.email,
      image: users.image,
    })
    .from(users);

  if (search) {
    query = query.where(
      and(
        ne(users.id, session.sub),
        or(
          like(users.displayName, `%${search}%`),
          like(users.email, `%${search}%`),
        ),
      ),
    );
  }

  const rows = await query;

  return NextResponse.json(rows);
}
