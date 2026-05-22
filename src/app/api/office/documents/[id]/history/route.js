import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { safeQuery } from "@/lib/db/db";
import { officeVersions } from "@/lib/db/schema";

export async function GET(req, { params }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const { data, error } = await safeQuery((db) =>
    db
      .select()
      .from(officeVersions)
      .where(eq(officeVersions.documentId, id))
      .orderBy(desc(officeVersions.createdAt)),
  );

  if (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }

  return NextResponse.json(data);
}

export async function POST(req, { params }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { content, label } = await req.json();

  const versionId = crypto.randomUUID();
  const { error } = await safeQuery((db) =>
    db.insert(officeVersions).values({
      id: versionId,
      documentId: id,
      content,
      label: label || `Version von ${new Date().toLocaleString()}`,
      createdAt: new Date(),
    }),
  );

  if (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }

  return NextResponse.json({ id: versionId });
}
