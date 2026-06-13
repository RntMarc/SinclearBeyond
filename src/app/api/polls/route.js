import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { phpFetch } from "@/lib/api/phpClient";
import { sendNotification } from "@/lib/notifications/service";
import { getPolls, validatePollData } from "@/lib/polls/utils";

export async function GET(request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const includeArchived = searchParams.get("archived") === "true";

  const userPolls = await getPolls(session.sub, includeArchived);
  return NextResponse.json(userPolls);
}

export async function POST(request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const {
      type = "appointment",
      title,
      description,
      allowCounterProposals,
      questions,
      invites,
    } = await request.json();

    if (!title || !questions || questions.length === 0) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const validation = validatePollData(questions);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const result = await phpFetch("/polls", {
      method: "POST",
      body: {
        type,
        title,
        description,
        allowCounterProposals: allowCounterProposals ? 1 : 0,
        creatorId: session.sub,
      },
    });

    if (!result.ok) {
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    const pollId = result.data?.data?.id;

    // Create questions and options via generic CRUD
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const qResult = await phpFetch("/poll-questions", {
        method: "POST",
        body: {
          pollId,
          title: q.title,
          type: q.type,
          order: i,
        },
      });

      const questionId = qResult.data?.data?.id;

      if (q.options && q.options.length > 0) {
        for (let optIdx = 0; optIdx < q.options.length; optIdx++) {
          const opt = q.options[optIdx];
          await phpFetch("/poll-options", {
            method: "POST",
            body: {
              questionId,
              label: opt.label,
              dateValue: opt.dateValue
                ? new Date(opt.dateValue).toISOString()
                : null,
              order: optIdx,
            },
          });
        }
      }
    }

    // Create invites
    if (invites && invites.length > 0) {
      for (const invite of invites) {
        await phpFetch("/poll-invites", {
          method: "POST",
          body: {
            pollId,
            userId: invite.userId,
            isIndispensable: invite.isIndispensable ? 1 : 0,
          },
        });
      }

      const targetUserIds = invites
        .filter((invite) => invite.userId !== session.sub)
        .map((invite) => invite.userId);

      if (targetUserIds.length > 0) {
        await sendNotification({
          userIds: targetUserIds,
          type: "poll",
          entityId: pollId,
          title: "Neue Umfrage",
          body: title || "Eine neue Umfrage wurde erstellt",
          link: `/umfrage/${pollId}`,
          tag: `poll-${pollId}`,
        });
      }
    }

    return NextResponse.json({ id: pollId });
  } catch (error) {
    console.error("Failed to create poll:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
