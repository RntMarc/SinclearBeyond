"use server";

import { getSession } from "@/lib/auth/session";
import { chatApiRequest } from "@/lib/chat/backend";

/**
 * Marks a chat as read for the current user.
 * @param {string} chatId The ID of the room or the user ID of the partner
 * @param {'direct'|'group'} chatType The type of chat
 */
export async function markChatAsRead(chatId, chatType) {
  const session = await getSession();
  if (!session?.sub) return { ok: false, error: "Unauthorized" };

  return chatApiRequest("/api/read", {
    method: "POST",
    body: {
      user_id: session.sub,
      chat_id: chatId,
      chat_type: chatType,
    },
  });
}

/**
 * Gets the unread message counts for the current user.
 */
export async function getUnreadChatCount() {
  const session = await getSession();
  if (!session?.sub) return 0;

  const result = await chatApiRequest("/api/unread", {
    query: { user_id: session.sub },
  });

  if (result.ok && result.data?.success) {
    return result.data.data.total || 0;
  }

  return 0;
}

/**
 * Gets detailed unread message counts (by room/partner).
 */
export async function getDetailedUnreadChatCounts() {
  const session = await getSession();
  if (!session?.sub) return { group: {}, direct: {}, total: 0 };

  const result = await chatApiRequest("/api/unread", {
    query: { user_id: session.sub },
  });

  if (result.ok && result.data?.success) {
    return result.data.data;
  }

  return { group: {}, direct: {}, total: 0 };
}
