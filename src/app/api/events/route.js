import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth/session";
import { phpFetch } from "@/lib/api/phpClient";
import { sendNotification } from "@/lib/notifications/service";

export async function POST(req) {
  const t = await getTranslations("Common");
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: t("unauthorized") }, { status: 401 });

  const body = await req.json();

  if (!body.title?.trim() || !body.startAt)
    return NextResponse.json({ error: t("missingFields") }, { status: 400 });

  const result = await phpFetch("/events", {
    method: "POST",
    body,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error || t("dbError") },
      { status: 500 },
    );
  }

  const event = result.data?.data;
  if (!event) {
    return NextResponse.json({ error: t("dbError") }, { status: 500 });
  }

  // Set permissions if provided
  const permissions = body.permissions || [];
  if (permissions.length > 0) {
    await phpFetch(`/events/${event.id}/permissions`, {
      method: "POST",
      body: { permissions },
    });

    // Create notifications for users with view permission
    try {
      const targetUserIds = permissions
        .filter((p) => p.canView && p.userId !== session.sub)
        .map((p) => p.userId);

      if (targetUserIds.length > 0) {
        await sendNotification({
          userIds: targetUserIds,
          type: "event",
          entityId: event.id,
          title: "Neues Event",
          body: body.title?.trim() || "Ein neues Event wurde erstellt",
          link: "/kalender",
          tag: `event-${event.id}`,
        });
      }
    } catch (notifyError) {
      console.error("[API/Events] Notification Error:", notifyError);
    }
  }

  return NextResponse.json({ ...event, canEdit: true }, { status: 201 });
}
