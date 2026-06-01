import crypto from "node:crypto";
import { db, safeQuery } from "@/lib/db/db";
import { notifications } from "@/lib/db/schema";
import { sendPushToUsers } from "@/lib/notifications/push";

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

  const now = new Date();

  // 1. Create in-app notifications in database
  const notificationValues = userIds.map((userId) => {
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
    await safeQuery(db.insert(notifications).values(notificationValues));
  } catch (error) {
    console.error("[NotificationService] Database insert error:", error);
    // Continue with push even if DB insert fails?
    // Usually we want both, but if DB fails, push might still work.
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
