import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/db";
import { pollInvites, pollOptions, polls } from "@/lib/db/schema";
import { getPolls } from "@/lib/polls/utils";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userPolls = await getPolls(session.sub);
  return NextResponse.json(userPolls);
}

export async function POST(request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { title, options, invites } = await request.json();

    if (!title || !options || options.length === 0) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const pollId = crypto.randomUUID();
    const now = new Date();

    await db.transaction(async (tx) => {
      await tx.insert(polls).values({
        id: pollId,
        title,
        creatorId: session.sub,
        createdAt: now,
        updatedAt: now,
      });

      if (options && options.length > 0) {
        await tx.insert(pollOptions).values(
          options.map((opt) => ({
            id: crypto.randomUUID(),
            pollId,
            startAt: new Date(opt.startAt),
            createdAt: now,
          })),
        );
      }

      if (invites && invites.length > 0) {
        await tx.insert(pollInvites).values(
          invites.map((invite) => ({
            id: crypto.randomUUID(),
            pollId,
            userId: invite.userId,
            isIndispensable: invite.isIndispensable ? 1 : 0,
            createdAt: now,
          })),
        );
      }
    });

    return NextResponse.json({ id: pollId });
  } catch (error) {
    console.error("Failed to create poll:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
