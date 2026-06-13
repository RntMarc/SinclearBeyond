import webpush from "web-push";
import { phpFetch } from "@/lib/api/phpClient";

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:beyond@sinclear.app";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

export async function sendPushToUser(userId, payload) {
  const result = await phpFetch(`/push-subscriptions?userId=${userId}`);
  if (!result.ok) return;

  const subscriptions = result.data?.data || [];
  if (subscriptions.length === 0) return;

  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        },
        JSON.stringify(payload),
      ),
    ),
  );

  const expired = [];
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === "rejected") {
      const statusCode = result.reason?.statusCode;
      if (statusCode === 410 || statusCode === 404 || statusCode === 400) {
        expired.push(subscriptions[i].endpoint);
      }
    }
  }

  if (expired.length > 0) {
    for (const endpoint of expired) {
      await phpFetch(`/push-subscriptions?endpoint=${encodeURIComponent(endpoint)}`, {
        method: "DELETE",
      });
    }
  }
}

export async function sendPushToUsers(userIds, payload) {
  await Promise.allSettled(
    userIds.map((userId) => sendPushToUser(userId, payload)),
  );
}
