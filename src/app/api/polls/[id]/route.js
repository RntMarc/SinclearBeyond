import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getPoll, validatePollData } from "@/lib/polls/utils";
import { phpFetch } from "@/lib/api/phpClient";

export async function GET(_request, { params }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const poll = await getPoll(id, session.sub);
  if (!poll) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(poll);
}

export async function PATCH(request, { params }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const poll = await getPoll(id, session.sub);
  if (!poll || poll.creatorId !== session.sub) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { title, description, allowCounterProposals, questions, invites } =
      await request.json();

    if (questions) {
      const validation = validatePollData(questions);
      if (!validation.valid) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }
    }

    const result = await phpFetch(`/polls/${id}`, {
      method: "PATCH",
      body: {
        title,
        description,
        allowCounterProposals,
        questions,
        invites,
      },
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update poll:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request, { params }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const poll = await getPoll(id, session.sub);
  if (!poll || poll.creatorId !== session.sub) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const result = await phpFetch(`/polls/${id}`, { method: "DELETE" });

    if (!result.ok) {
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete poll:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
