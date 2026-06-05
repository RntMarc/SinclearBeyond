import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth/session";
import { getUnreadCalendarCount } from "@/lib/calendar/actions";
import { getUnreadChangelogCount } from "@/lib/changelog/actions";
import { getUnreadChatCount } from "@/lib/chat/actions";
import { getUnreadForumsCount } from "@/lib/forums/actions";
import { getUnreadPollsCount } from "@/lib/polls/actions";
import { getUnreadBirthdaysCount } from "@/lib/profile/birthdayActions";
import { getUnreadTravelCount } from "@/lib/travel/actions";

export async function GET() {
  const t = await getTranslations("Common");
  const session = await getSession();
  if (!session?.sub) {
    return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
  }

  const [
    unreadChangelog,
    unreadForums,
    unreadTravel,
    unreadCalendar,
    unreadPolls,
    unreadBirthdays,
    unreadChat,
  ] = await Promise.all([
    getUnreadChangelogCount(),
    getUnreadForumsCount(),
    getUnreadTravelCount(),
    getUnreadCalendarCount(),
    getUnreadPollsCount(),
    getUnreadBirthdaysCount(),
    getUnreadChatCount(),
  ]);

  return NextResponse.json({
    unreadChangelog,
    unreadForums,
    unreadTravel,
    unreadCalendar,
    unreadPolls,
    unreadBirthdays,
    unreadChat,
  });
}
