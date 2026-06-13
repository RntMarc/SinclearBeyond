import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { phpFetch } from "@/lib/api/phpClient";

export async function POST(request, { params }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { optionId, closeOnly } = await request.json();

    // Get poll details to check type
    const pollResult = await phpFetch(`/polls/${id}/detail`);
    if (!pollResult.ok) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const poll = pollResult.data?.data;

    // Finalize the poll
    const finalizeResult = await phpFetch(`/polls/${id}/finalize`, {
      method: "POST",
      body: { optionId: optionId || "closed" },
    });

    if (!finalizeResult.ok) {
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 },
      );
    }

    // Create calendar event if appointment with selected option
    let eventId = null;
    if (poll.type === "appointment" && optionId && !closeOnly) {
      // Find the selected option's date
      const option = poll.options?.find((o) => o.id === optionId);
      if (option?.dateValue) {
        const startDate = new Date(option.dateValue);
        const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1h default

        const eventResult = await phpFetch("/events", {
          method: "POST",
          body: {
            title: poll.title,
            startAt: startDate.toISOString(),
            endAt: endDate.toISOString(),
            allDay: false,
            isPublic: false,
          },
        });

        if (eventResult.ok) {
          eventId = eventResult.data?.data?.id;

          // Add participants and permissions
          const inviteIds = (poll.invites || [])
            .filter((i) => i.userId !== session.sub)
            .map((i) => i.userId);
          const participantIds = [session.sub, ...inviteIds];

          if (participantIds.length > 0 && eventId) {
            await phpFetch(`/events/${eventId}/permissions`, {
              method: "POST",
              body: {
                permissions: participantIds.map((uId) => ({
                  userId: uId,
                  canView: true,
                  canEdit: uId === session.sub,
                })),
              },
            });
          }
        }
      }
    }

    return NextResponse.json({ success: true, eventId });
  } catch (error) {
    console.error("Failed to finalize poll:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
