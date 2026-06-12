import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth/session";
import { db, safeQuery } from "@/lib/db/db";
import {
  users,
} from "@/lib/db/schema";
import { phpFetch } from "@/lib/api/phpClient";
import { getWhoMarkedMe, getWhoIMarked } from "@/lib/profile/closeFriends";

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
  const { data: allUsersWithBirthday, error: usersError } = await safeQuery(
    db
      .select({
        id: users.id,
        displayName: users.displayName,
        birthday: users.birthday,
        birthdayVisibility: users.birthdayVisibility,
      })
      .from(users)
      .where(and(eq(users.id, users.id))),
  ); // Dummy to ensure select

  const whoMarkedMeRecords = await getWhoMarkedMe();
  const visibilityCloseFriendIds = new Set(
    whoMarkedMeRecords.map((r) => r.userId),
  );

  // 5. CloseFriends abrufen, die ICH markiert habe (für Herzchen-Symbol)
  const whoIMarkedRecords = await getWhoIMarked();
  const myCloseFriendIds = new Set(
    whoIMarkedRecords.map((r) => r.friendId),
  );

  if (
    eventsError ||
    usersError
  ) {
    return NextResponse.json({ error: t("dbError") }, { status: 500 });
  }

  const birthdays = (allUsersWithBirthday || [])
    .filter((u) => {
      if (!u.birthday) return false;
      if (u.id === userId) return true;
      const visibility = u.birthdayVisibility;
      const allowsMePrivateInfo = visibilityCloseFriendIds.has(u.id);
      return visibility === 1 || (visibility === 2 && allowsMePrivateInfo);
    })
    .map((u) => ({
      id: u.id,
      displayName: u.displayName,
      birthday: u.birthday,
      isCloseFriend: myCloseFriendIds.has(u.id),
    }));

  return NextResponse.json({
    events: standardEvents.map((ev) => ({ ...ev, type: "event" })),
    trips: trips.map((t) => ({ ...t, type: "trip" })),
    travelEvents: trvEvents.map((te) => ({ ...te, type: "travelEvent" })),
    birthdays: birthdays.map((b) => ({ ...b, type: "birthday" })),
  });
}
