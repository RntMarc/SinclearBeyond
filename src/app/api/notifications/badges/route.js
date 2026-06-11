import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth/session";
import { phpFetch } from "@/lib/api/phpClient";
import { getUnreadChatCount } from "@/lib/chat/actions";

const TYPE_MAP = {
  changelog: "unreadChangelog",
  forum: "unreadForums",
  poll: "unreadPolls",
  chat: "unreadChat",
};

export async function GET() {
  const t = await getTranslations("Common");
  const session = await getSession();
  if (!session?.sub) {
    return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
  }

  const result = await phpFetch("/notifications/badges");
  const badges = result.ok ? (result.data?.data || {}) : {};

  const unreadChangelog = badges.changelog || 0;
  const unreadForums = badges.forum || 0;
  const unreadPolls = badges.poll || 0;
  const unreadTravel = (badges.trip || 0) + (badges.event || 0);
  const unreadCalendar = badges.event || 0;
  const unreadBirthdays = (badges.birthday || 0) + (badges.birthday_soon || 0);
  const unreadChat = await getUnreadChatCount();

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
