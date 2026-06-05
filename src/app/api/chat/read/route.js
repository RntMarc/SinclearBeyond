import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth/session";
import { markChatAsRead } from "@/lib/chat/actions";

export async function POST(request) {
  const t = await getTranslations("Common");
  const session = await getSession();
  if (!session?.sub) {
    return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: t("missingFields") }, { status: 400 });
  }

  const { chatId, chatType } = body;
  if (!chatId || !chatType) {
    return NextResponse.json({ error: t("missingFields") }, { status: 400 });
  }

  const result = await markChatAsRead(chatId, chatType);

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error || t("genericError") },
      { status: result.status || 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
