import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth/session";
import { phpFetch } from "@/lib/api/phpClient";
import { sendNotification } from "@/lib/notifications/service";

export async function GET(_req, { params }) {
  const t = await getTranslations("Common");
  const session = await getSession();
  const { id } = await params;

  if (!session) {
    return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
  }

  try {
    const result = await phpFetch(`/travel/trips/${id}/participants`);

    if (!result.ok) {
      return NextResponse.json({ error: result.error || t("loadError") }, { status: result.status || 500 });
    }

    return NextResponse.json(result.data?.data || []);
  } catch (error) {
    console.error("[API/Travel/Trips/Participants] GET Error:", error);
    return NextResponse.json({ error: t("loadError") }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  const t = await getTranslations("Common");
  const session = await getSession();
  const { id } = await params;

  if (!session?.isAdmin) {
    return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
  }

  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: t("missingFields") }, { status: 400 });
    }

    const result = await phpFetch(`/travel/trips/${id}/participants`, {
      method: "POST",
      body: { userId },
    });

    if (!result.ok) {
      if (result.status === 409) {
        return NextResponse.json({ ok: true, message: t("alreadyParticipant") });
      }
      return NextResponse.json({ error: result.error || t("saveError") }, { status: result.status || 500 });
    }

    if (userId !== session.sub) {
      try {
        await sendNotification({
          userIds: [userId],
          type: "trip",
          entityId: id,
          title: "Neue Reise",
          body: "Du wurdest zu einer Reise hinzugefügt",
          link: `/reisen/${id}`,
          tag: `trip-${id}`,
        });
      } catch (notifyError) {
        console.error(
          "[API/Travel/Trips/Participants] Notification Error:",
          notifyError,
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[API/Travel/Trips/Participants] POST Error:", error);
    return NextResponse.json({ error: t("saveError") }, { status: 500 });
  }
}
