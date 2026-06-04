import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth/session";
import {
  chatApiRequest,
  getChatRoom,
  listChatRoomMembers,
} from "@/lib/chat/backend";
import { db, safeQuery } from "@/lib/db/db";
import { users } from "@/lib/db/schema";
import { sendNotification } from "@/lib/notifications/service";

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
    const attachment = body.attachment_url.trim();
    if (attachment.startsWith("data:")) {
      payload.attachment_type = "image";
      payload.attachment_body = attachment;
    } else {
      payload.attachment_type = "link";
      payload.attachment_body = attachment;
    }
  }

  const result = await chatApiRequest("/api/messages", {
    method: "POST",
    body: payload,
  });

  if (result.ok) {
    try {
      // Background: Send notifications to other participants
      const senderId = session.sub;
      const { data: senderData } = await safeQuery(
        db
          .select({ displayName: users.displayName })
          .from(users)
          .where(eq(users.id, senderId))
          .limit(1),
      );
      const senderName = senderData?.[0]?.displayName || "Nutzer";

      let recipients = [];
      let notificationTitle = senderName;
      let notificationLink = "/chat";

      if (chatType === "group") {
        const [roomRes, membersRes] = await Promise.all([
          getChatRoom(chatId),
          listChatRoomMembers(chatId),
        ]);

        if (roomRes.ok && membersRes.ok) {
          notificationTitle = roomRes.data?.data?.name || "Gruppen-Chat";
          recipients = (membersRes.data?.data || []).filter(
            (id) => id !== senderId,
          );
          notificationLink = `/chat?room=${chatId}`;
        }
      } else {
        recipients = [chatId];
        notificationLink = `/chat?user=${senderId}`;
      }

      if (recipients.length > 0) {
        await sendNotification({
          userIds: recipients,
          type: "chat",
          entityId: chatId,
          title: notificationTitle,
          body: `${senderName}: ${messageBody}`,
          link: notificationLink,
        });
      }
    } catch (error) {
      console.error("[ChatAPI] Notification error:", error);
    }
  }

  if (!result.ok) {
    return NextResponse.json(
      { error: getMessageError(t, result) },
      { status: result.status || 502 },
    );
  }

  return NextResponse.json(result.data, { status: result.status || 201 });
}
