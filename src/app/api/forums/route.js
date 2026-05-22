import { desc, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db, safeQuery } from "@/lib/db/db";
import { forums } from "@/lib/db/schema";

export async function GET() {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await safeQuery(
    db.select().from(forums).orderBy(desc(forums.createdAt)),
  );

  if (error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );

  return NextResponse.json(data || []);
}
