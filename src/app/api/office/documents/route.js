import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { safeQuery } from "@/lib/db/db";
import { officeDocuments } from "@/lib/db/schema";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await safeQuery((db) =>
    db.select().from(officeDocuments).orderBy(desc(officeDocuments.updatedAt)),
  );

  if (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }

  return NextResponse.json(data);
}

export async function POST(req) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { title } = await req.json();
    const id = crypto.randomUUID();
    const now = new Date();

    const { error } = await safeQuery((db) =>
      db.insert(officeDocuments).values({
        id,
        title: title || "Unbenanntes Dokument",
        creatorId: session.sub,
        createdAt: now,
        updatedAt: now,
      }),
    );

    if (error) {
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 },
      );
    }

    return NextResponse.json({ id, title });
  } catch (err) {
    return NextResponse.json({ error: "Invalid Request" }, { status: 400 });
  }
}
