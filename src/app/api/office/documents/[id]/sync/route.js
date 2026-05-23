import { eq, and, gt } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db, safeQuery } from "@/lib/db/db";
import { officeDocuments, officeCollaborators, users } from "@/lib/db/schema";
import * as Y from "yjs";
import { isAccessible } from "@/lib/utils/color";

const ACCESSIBLE_COLORS = [
  "#f87171",
  "#fb923c",
  "#fbbf24",
  "#facc15",
  "#a3e635",
  "#4ade80",
  "#34d399",
  "#2dd4bf",
  "#22d3ee",
  "#38bdf8",
  "#60a5fa",
  "#818cf8",
  "#a78bfa",
  "#c084fc",
  "#e879f9",
  "#f472b6",
  "#fb7185",
];

export async function POST(req, { params }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { update, presence } = await req.json();
  const now = new Date();

  // 1. Update presence
  const collaboratorId = `${id}-${session.sub}`;
  const { data: existingCollab, error: collabError } = await safeQuery(
    db
      .select()
      .from(officeCollaborators)
      .where(
        and(
          eq(officeCollaborators.documentId, id),
          eq(officeCollaborators.userId, session.sub),
        ),
      )
      .limit(1),
  );

  if (collabError) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }

  let color = existingCollab?.[0]?.color;
  if (!color) {
    const { data: others, error: othersError } = await safeQuery(
      db
        .select({ color: officeCollaborators.color })
        .from(officeCollaborators)
        .where(eq(officeCollaborators.documentId, id)),
    );

    if (othersError) {
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 },
      );
    }
    const usedColors = others?.map((o) => o.color) || [];

    // Filter colors that are accessible against dark background (used in UI)
    const background = "#1e293b"; // Example background color from UI
    const candidateColors = ACCESSIBLE_COLORS.filter((c) =>
      isAccessible(c, background),
    );

    const availableColors = candidateColors.filter(
      (c) => !usedColors.includes(c),
    );
    color =
      availableColors.length > 0
        ? availableColors[0]
        : candidateColors[Math.floor(Math.random() * candidateColors.length)];

    // If still no color (highly unlikely), fallback
    if (!color) color = ACCESSIBLE_COLORS[0];

    const { error: insertCollabError } = await safeQuery(
      db
        .insert(officeCollaborators)
        .values({
          id: collaboratorId,
          documentId: id,
          userId: session.sub,
          color,
          lastActiveAt: now,
        })
        .onDuplicateKeyUpdate({
          set: { lastActiveAt: now },
        }),
    );

    if (insertCollabError) {
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 },
      );
    }
  } else {
    const { error: updateCollabError } = await safeQuery(
      db
        .update(officeCollaborators)
        .set({ lastActiveAt: now })
        .where(eq(officeCollaborators.id, collaboratorId)),
    );

    if (updateCollabError) {
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 },
      );
    }
  }

  if (update) {
    const { data: docData, error: docDataError } = await safeQuery(
      db
        .select()
        .from(officeDocuments)
        .where(eq(officeDocuments.id, id))
        .limit(1),
    );

    if (docDataError) {
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 },
      );
    }

    if (docData && docData.length > 0) {
      const doc = new Y.Doc();
      if (docData[0].content) {
        Y.applyUpdate(doc, Buffer.from(docData[0].content, "base64"));
      }
      Y.applyUpdate(doc, Buffer.from(update, "base64"));

      const newState = Buffer.from(Y.encodeStateAsUpdate(doc)).toString(
        "base64",
      );
      const { error: updateDocError } = await safeQuery(
        db
          .update(officeDocuments)
          .set({
            content: newState,
            updatedAt: now,
          })
          .where(eq(officeDocuments.id, id)),
      );

      if (updateDocError) {
        return NextResponse.json(
          { error: "Internal Server Error" },
          { status: 500 },
        );
      }
    }
  }

  const activeThreshold = new Date(now.getTime() - 15000);
  const { data: activeCollaborators, error: activeCollabError } =
    await safeQuery(
      db
        .select({
          userId: officeCollaborators.userId,
          displayName: users.displayName,
          color: officeCollaborators.color,
          lastActiveAt: officeCollaborators.lastActiveAt,
        })
        .from(officeCollaborators)
        .innerJoin(users, eq(officeCollaborators.userId, users.id))
        .where(
          and(
            eq(officeCollaborators.documentId, id),
            gt(officeCollaborators.lastActiveAt, activeThreshold),
          ),
        ),
    );

  if (activeCollabError) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }

  const { data: currentDoc, error: currentDocError } = await safeQuery(
    db
      .select({ content: officeDocuments.content })
      .from(officeDocuments)
      .where(eq(officeDocuments.id, id))
      .limit(1),
  );

  if (currentDocError) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    content: currentDoc?.[0]?.content || null,
    collaborators: (activeCollaborators || []).map((c) => ({
      ...c,
      lastActiveAt: c.lastActiveAt?.toISOString
        ? c.lastActiveAt.toISOString()
        : c.lastActiveAt,
    })),
  });
}
