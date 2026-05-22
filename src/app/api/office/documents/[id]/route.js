import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { safeQuery } from "@/lib/db/db";
import {
  officeDocuments,
  officeCollaborators,
  officeVersions,
} from "@/lib/db/schema";

export async function GET(req, { params }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const { data: documents, error: docError } = await safeQuery((db) =>
    db
      .select()
      .from(officeDocuments)
      .where(eq(officeDocuments.id, id))
      .limit(1),
  );

  if (docError || !documents.length) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  return NextResponse.json(documents[0]);
}

export async function DELETE(req, { params }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Verify ownership or admin status
  const { data: documents, error: docError } = await safeQuery((db) =>
    db
      .select()
      .from(officeDocuments)
      .where(eq(officeDocuments.id, id))
      .limit(1),
  );

  if (docError || !documents.length) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  if (documents[0].creatorId !== session.sub && !session.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Delete related data
  await safeQuery((db) =>
    db
      .delete(officeCollaborators)
      .where(eq(officeCollaborators.documentId, id)),
  );
  await safeQuery((db) =>
    db.delete(officeVersions).where(eq(officeVersions.documentId, id)),
  );

  const { error: deleteError } = await safeQuery((db) =>
    db.delete(officeDocuments).where(eq(officeDocuments.id, id)),
  );

  if (deleteError) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
