import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/db";
import { passkeys } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

export async function POST(req) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await req.json();
    await db
      .delete(passkeys)
      .where(and(eq(passkeys.id, id), eq(passkeys.userId, session.sub)));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
