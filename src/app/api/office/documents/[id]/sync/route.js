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
  const { data: existingCollab } = await safeQuery(
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

  let color = existingCollab?.[0]?.color;
  if (!color) {
    const { data: others } = await safeQuery(
      db
        .select({ color: officeCollaborators.color })
        .from(officeCollaborators)
        .where(eq(officeCollaborators.documentId, id)),
    );
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

    await safeQuery(
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
  } else {
    await safeQuery(
      db
        .update(officeCollaborators)
        .set({ lastActiveAt: now })
        .where(eq(officeCollaborators.id, collaboratorId)),
    );
  }

  if (update) {
    const { data: docData } = await safeQuery(
      db
        .select()
        .from(officeDocuments)
        .where(eq(officeDocuments.id, id))
        .limit(1),
    );

    if (docData && docData.length > 0) {
      const doc = new Y.Doc();
      if (docData[0].content) {
        Y.applyUpdate(doc, Buffer.from(docData[0].content, "base64"));
      }
      Y.applyUpdate(doc, Buffer.from(update, "base64"));

      const newState = Buffer.from(Y.encodeStateAsUpdate(doc)).toString(
        "base64",
      );
      await safeQuery(
        db
          .update(officeDocuments)
          .set({
            content: newState,
            updatedAt: now,
          })
          .where(eq(officeDocuments.id, id)),
      );
    }
  }

  const activeThreshold = new Date(now.getTime() - 15000);
  const { data: activeCollaborators } = await safeQuery(
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

  const { data: currentDoc } = await safeQuery(
    db
      .select({ content: officeDocuments.content })
      .from(officeDocuments)
      .where(eq(officeDocuments.id, id))
      .limit(1),
  );

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
