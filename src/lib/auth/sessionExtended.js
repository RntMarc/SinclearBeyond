import { and, eq } from "drizzle-orm";
import { getSession as getOriginalSession } from "@/lib/auth/session";
import { db, safeQuery } from "@/lib/db/db";
import { subscriptionRelations } from "@/lib/db/schema";

export async function getSessionWithSubs() {
  const session = await getOriginalSession();
  if (!session) return null;

  const { data: results, error } = await safeQuery(
    db
      .select({ id: subscriptionRelations.id })
      .from(subscriptionRelations)
      .where(
        and(
          eq(subscriptionRelations.userId, session.sub),
          eq(subscriptionRelations.isUser, 1),
        ),
      )
      .limit(1),
  );

  if (error) {
    console.error("[SessionExtended] DB error checking subscriptions:", error);
    return { ...session, hasSubscriptions: false };
  }

  return {
    ...session,
    hasSubscriptions: (results || []).length > 0,
  };
}
