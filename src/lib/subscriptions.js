import { and, eq, inArray } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/db";
import { subscriptionRelations, subscriptions, users } from "@/lib/db/schema";

export async function getSubscriptions() {
  const session = await getSession();
  if (!session?.sub) return null;

  const userRelations = await db
    .select({ subscriptionId: subscriptionRelations.subscriptionId })
    .from(subscriptionRelations)
    .where(
      and(
        eq(subscriptionRelations.userId, session.sub),
        eq(subscriptionRelations.isUser, 1),
      ),
    );

  const mySubscriptionIds = userRelations.map((r) => r.subscriptionId);

  let subs;
  if (session.isAdmin) {
    subs = await db.select().from(subscriptions);
  } else {
    if (mySubscriptionIds.length === 0) return [];
    subs = await db
      .select()
      .from(subscriptions)
      .where(inArray(subscriptions.id, mySubscriptionIds));
  }

  // Enhance with members
  const result = [];
  for (const sub of subs) {
    const relations = await db
      .select({
        id: subscriptionRelations.id,
        userId: subscriptionRelations.userId,
        isUser: subscriptionRelations.isUser,
        userName: subscriptionRelations.userName,
        hasPaid: subscriptionRelations.hasPaid,
        user: {
          id: users.id,
          displayName: users.displayName,
        },
      })
      .from(subscriptionRelations)
      .leftJoin(users, eq(subscriptionRelations.userId, users.id))
      .where(eq(subscriptionRelations.subscriptionId, sub.id));

    result.push({
      ...sub,
      members: relations.map((r) => ({
        id: r.id,
        userId: r.userId,
        isUser: r.isUser,
        userName: r.isUser ? r.user?.displayName : r.userName,
        hasPaid: r.hasPaid,
      })),
      isParticipant: mySubscriptionIds.includes(sub.id),
    });
  }

  return result;
}

export async function createSubscription(data) {
  const session = await getSession();
  if (!session?.isAdmin) return null;

  const subscriptionId = crypto.randomUUID();
  const { name, billingPeriodStart, billingPeriodEnd, basePrice, members } =
    data;

  await db.insert(subscriptions).values({
    id: subscriptionId,
    name,
    billingPeriodStart: new Date(billingPeriodStart),
    billingPeriodEnd: new Date(billingPeriodEnd),
    basePrice: Number.parseFloat(basePrice),
  });

  if (members && Array.isArray(members)) {
    for (const member of members) {
      await db.insert(subscriptionRelations).values({
        id: crypto.randomUUID(),
        subscriptionId,
        userId: member.isUser ? member.userId : null,
        isUser: member.isUser ? 1 : 0,
        userName: member.isUser ? null : member.userName,
        hasPaid: member.hasPaid ? 1 : 0,
      });
    }
  }

  return subscriptionId;
}

export async function updateSubscription(id, data) {
  const session = await getSession();
  if (!session?.isAdmin) return null;

  const { name, billingPeriodStart, billingPeriodEnd, basePrice, members } =
    data;

  await db
    .update(subscriptions)
    .set({
      name,
      billingPeriodStart: new Date(billingPeriodStart),
      billingPeriodEnd: new Date(billingPeriodEnd),
      basePrice: Number.parseFloat(basePrice),
    })
    .where(eq(subscriptions.id, id));

  if (members && Array.isArray(members)) {
    // Simple approach: delete all and re-insert
    await db
      .delete(subscriptionRelations)
      .where(eq(subscriptionRelations.subscriptionId, id));

    for (const member of members) {
      await db.insert(subscriptionRelations).values({
        id: crypto.randomUUID(),
        subscriptionId: id,
        userId: member.isUser ? member.userId : null,
        isUser: member.isUser ? 1 : 0,
        userName: member.isUser ? null : member.userName,
        hasPaid: member.hasPaid ? 1 : 0,
      });
    }
  }

  return true;
}

export async function deleteSubscription(id) {
  const session = await getSession();
  if (!session?.isAdmin) return null;

  await db
    .delete(subscriptionRelations)
    .where(eq(subscriptionRelations.subscriptionId, id));
  await db.delete(subscriptions).where(eq(subscriptions.id, id));

  return true;
}
