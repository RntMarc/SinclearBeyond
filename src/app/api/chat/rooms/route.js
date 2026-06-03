import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth/session";
import { listChatRooms } from "@/lib/chat/backend";

export async function GET() {
  const t = await getTranslations("Common");
  const session = await getSession();
  if (!session?.sub) {
    return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
  }

  const result = await listChatRooms();
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error || t("loadError") },
      { status: result.status || 502 },
    );
  }

  return NextResponse.json(result.data);
}
