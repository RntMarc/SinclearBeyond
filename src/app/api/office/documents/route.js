import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db, safeQuery } from "@/lib/db/db";
import { officeDocuments } from "@/lib/db/schema";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await safeQuery(
    db.select().from(officeDocuments).orderBy(desc(officeDocuments.updatedAt)),
  );

  if (error) {
    console.error("[Office API] GET /documents error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }

  return NextResponse.json(
    (data || []).map((doc) => ({
      ...doc,
      createdAt: doc.createdAt?.toISOString
        ? doc.createdAt.toISOString()
        : doc.createdAt,
      updatedAt: doc.updatedAt?.toISOString
        ? doc.updatedAt.toISOString()
        : doc.updatedAt,
    })),
  );
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

    const { error } = await safeQuery(
      db.insert(officeDocuments).values({
        id,
        title: title || "Unbenanntes Dokument",
        creatorId: session.sub,
        createdAt: now,
        updatedAt: now,
      }),
    );

    if (error) {
      console.error("[Office API] POST /documents error:", error);
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 },
      );
    }

    return NextResponse.json({ id, title });
  } catch (err) {
    console.error("[Office API] POST /documents exception:", err);
    return NextResponse.json({ error: "Invalid Request" }, { status: 400 });
  }
}
