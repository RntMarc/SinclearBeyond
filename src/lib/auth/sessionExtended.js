import { getSession as getOriginalSession } from "@/lib/auth/session";
import { phpFetch } from "@/lib/api/phpClient";

export async function getSessionWithSubs() {
  const session = await getOriginalSession();
  if (!session) return null;

  // We check for subscriptions via the PHP API
  const result = await phpFetch(`/subscriptions/user/${session.sub}`);

  if (!result.ok) {
    return { ...session, hasSubscriptions: false };
  }

  const subscriptions = result.data.data || [];

  return {
    ...session,
    hasSubscriptions: subscriptions.length > 0,
  };
}
