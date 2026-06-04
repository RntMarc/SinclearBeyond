import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth/session";
import { chatApiRequest } from "@/lib/chat/backend";

const ALLOWED_CHAT_TYPES = new Set(["direct", "group"]);

function getMessageError(t, result) {
  return result.error || t("genericError");
}

export async function GET(request) {
  const t = await getTranslations("Common");
  const session = await getSession();
  if (!session?.sub) {
    return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
  }

  const incoming = request.nextUrl.searchParams;
  const chatType = incoming.get("chat_type");
  if (!ALLOWED_CHAT_TYPES.has(chatType)) {
    return NextResponse.json({ error: t("missingFields") }, { status: 400 });
  }

  const outgoing = new URLSearchParams();
  outgoing.set("chat_type", chatType);
  outgoing.set("user_id", session.sub);

  if (chatType === "direct") {
    const partnerId = incoming.get("chat_partner_id");
    if (!partnerId) {
      return NextResponse.json({ error: t("missingFields") }, { status: 400 });
    }
    outgoing.set("chat_partner_id", partnerId);
  } else {
    const chatId = incoming.get("chat_id");
    if (!chatId) {
      return NextResponse.json({ error: t("missingFields") }, { status: 400 });
    }
    outgoing.set("chat_id", chatId);
  }

  for (const key of ["after", "before", "limit"]) {
    const value = incoming.get(key);
    if (value) outgoing.set(key, value);
  }

  const result = await chatApiRequest("/api/messages", { query: outgoing });
  if (!result.ok) {
    return NextResponse.json(
      { error: getMessageError(t, result) },
      { status: result.status || 502 },
    );
  }

  return NextResponse.json(result.data);
}

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

  const chatType = body?.chat_type;
  const chatId = typeof body?.chat_id === "string" ? body.chat_id.trim() : "";
  const messageBody = typeof body?.body === "string" ? body.body.trim() : "";

  if (!ALLOWED_CHAT_TYPES.has(chatType) || !chatId || !messageBody) {
    return NextResponse.json({ error: t("missingFields") }, { status: 400 });
  }

  const payload = {
    user_id: session.sub,
    chat_id: chatId,
    chat_type: chatType,
    body: messageBody,
  };

  if (typeof body?.attachment_url === "string" && body.attachment_url.trim()) {
    payload.attachment_url = body.attachment_url.trim();
  }

  const result = await chatApiRequest("/api/messages", {
    method: "POST",
    body: payload,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: getMessageError(t, result) },
      { status: result.status || 502 },
    );
  }

  return NextResponse.json(result.data, { status: result.status || 201 });
}
