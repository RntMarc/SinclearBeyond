import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth/session";
import { getDetailedUnreadChatCounts } from "@/lib/chat/actions";

export async function GET() {
  const t = await getTranslations("Common");
  const session = await getSession();
  if (!session?.sub) {
    return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
  }

  const counts = await getDetailedUnreadChatCounts();
  return NextResponse.json(counts);
}
