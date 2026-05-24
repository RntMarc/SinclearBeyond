import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db, safeQuery } from "@/lib/db/db";
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

  const { data: documents, error: docError } = await safeQuery(
    db
      .select()
      .from(officeDocuments)
      .where(eq(officeDocuments.id, id))
      .limit(1),
  );

  if (docError) {
    console.error(`[Office API] GET /documents/${id} error:`, docError);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }

  if (!documents.length) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const doc = documents[0];
  return NextResponse.json({
    ...doc,
    createdAt: doc.createdAt?.toISOString
      ? doc.createdAt.toISOString()
      : doc.createdAt,
    updatedAt: doc.updatedAt?.toISOString
      ? doc.updatedAt.toISOString()
      : doc.updatedAt,
  });
}

export async function DELETE(req, { params }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Verify ownership or admin status
  const { data: documents, error: docError } = await safeQuery(
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
  await safeQuery(
    db
      .delete(officeCollaborators)
      .where(eq(officeCollaborators.documentId, id)),
  );
  await safeQuery(
    db.delete(officeVersions).where(eq(officeVersions.documentId, id)),
  );

  const { error: deleteError } = await safeQuery(
    db.delete(officeDocuments).where(eq(officeDocuments.id, id)),
  );

  if (deleteError) {
    console.error(`[Office API] DELETE /documents/${id} error:`, deleteError);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
