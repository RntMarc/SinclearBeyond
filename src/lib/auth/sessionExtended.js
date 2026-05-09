import { and, eq } from "drizzle-orm";
import { getSession as getOriginalSession } from "@/lib/auth/session";
import { db } from "@/lib/db/db";
import { subscriptionRelations } from "@/lib/db/schema";

export async function getSessionWithSubs() {
  const session = await getOriginalSession();
  if (!session) return null;

  const results = await db
    .select({ id: subscriptionRelations.id })
    .from(subscriptionRelations)
    .where(
      and(
        eq(subscriptionRelations.userId, session.sub),
        eq(subscriptionRelations.isUser, 1),
      ),
    )
    .limit(1);

  return {
    ...session,
    hasSubscriptions: results.length > 0,
  };
}
