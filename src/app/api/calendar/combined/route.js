import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth/session";
import { phpFetch } from "@/lib/api/phpClient";

export async function GET() {
  const t = await getTranslations("Common");
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: t("unauthorized") }, { status: 401 });

  const userId = session.sub;

  // 1. Standard Events
  let standardEvents = [];
  let eventsError = false;
  const calResult = await phpFetch("/calendar/combined");
  if (calResult.ok) {
    const allItems = calResult.data?.data || [];
    standardEvents = allItems
      .filter((item) => item.source === "event")
      .map((ev) => ({
        ...ev,
        canEdit: session.isAdmin || ev.creatorId === userId || ev.canEdit === 1,
      }));
  } else {
    eventsError = true;
  }

  // 2. Trips
  let trips = [];
  let trvEvents = [];
  const myTripsResult = await phpFetch("/travel/my-trips");
  if (myTripsResult.ok) {
    trips = myTripsResult.data?.data || [];
  }
  const myEventsResult = await phpFetch("/travel/my-events");
  if (myEventsResult.ok) {
    trvEvents = myEventsResult.data?.data || [];
  }

  // 4. Birthdays
  const birthdaysResult = await phpFetch("/home/birthdays");
  const birthdays = birthdaysResult.ok ? (birthdaysResult.data?.data || []) : [];

  if (eventsError) {
    return NextResponse.json({ error: t("dbError") }, { status: 500 });
  }

  return NextResponse.json({
    events: standardEvents.map((ev) => ({ ...ev, type: "event" })),
    trips: trips.map((t) => ({ ...t, type: "trip" })),
    travelEvents: trvEvents.map((te) => ({ ...te, type: "travelEvent" })),
    birthdays: birthdays.map((b) => ({ ...b, type: "birthday" })),
  });
}
