import crypto from "node:crypto";
import { sendPushToUsers } from "@/lib/notifications/push";
import { phpFetch } from "@/lib/api/phpClient";

/**
 * Unified service to send notifications (both in-app and push).
 *
 * @param {Object} options
 * @param {string[]} options.userIds - Array of user IDs to receive the notification.
 * @param {string} options.type - Type of notification (forum, poll, event, trip, changelog, birthday, test).
 * @param {string} options.entityId - ID of the related entity.
 * @param {string} options.title - Title for the notification.
 * @param {string} options.body - Body text for the notification.
 * @param {string} options.link - Relative URL for the notification.
 * @param {string} [options.tag] - Optional tag for push notification grouping.
 */
export async function sendNotification({
  userIds,
  type,
  entityId,
  title,
  body,
  link,
  tag,
}) {
  if (!userIds || userIds.length === 0) return;

  // Deduplicate userIds to prevent multiple notifications for the same user
  const uniqueUserIds = [...new Set(userIds)];
  const now = new Date();

  // 1. Create in-app notifications via PHP API
  const notificationValues = uniqueUserIds.map((userId) => {
    const id = crypto.randomUUID();
    return {
      id,
      userId,
      type,
      entityId,
      createdAt: now,
    };
  });

  try {
    await Promise.all(
      notificationValues.map((n) =>
        phpFetch("/notifications", {
          method: "POST",
          body: {
            id: n.id,
            userId: n.userId,
            type: n.type,
            entityId: n.entityId,
            createdAt: n.createdAt.toISOString(),
          },
        }),
      ),
    );
  } catch (error) {
    console.error("[NotificationService] API insert error:", error);
  }

  // 2. Send push notifications
  // We include the notification ID in the link for auto-marking as read
  try {
    // For push, we send to each user individually to include their specific notification ID in the link
    await Promise.allSettled(
      notificationValues.map((n) => {
        const pushLink = link.includes("?")
          ? `${link}&readNotification=${n.id}`
          : `${link}?readNotification=${n.id}`;

        return sendPushToUsers([n.userId], {
          title,
          body,
          url: pushLink,
          tag: tag || `${type}-${entityId}`,
        });
      }),
    );
  } catch (error) {
    console.error("[NotificationService] Push send error:", error);
  }
}
