import { getSession } from "@/lib/auth/session";
import { phpFetch } from "@/lib/api/phpClient";

export async function getSubscriptions() {
  const session = await getSession();
  if (!session?.sub) return null;

  // Get user's subscription relations
  const relRes = await phpFetch(
    `/subscription-relations?userId=${session.sub}&isUser=1`,
  );
  const userRelations = relRes.ok ? (relRes.data?.data || []) : [];
  const mySubscriptionIds = userRelations.map((r) => r.subscriptionId);

  let subs = [];
  if (session.isAdmin) {
    const allRes = await phpFetch("/subscriptions");
    subs = allRes.ok ? (allRes.data?.data || []) : [];
  } else {
    if (mySubscriptionIds.length === 0) return [];
    // Fetch each subscription
    const subPromises = mySubscriptionIds.map((id) =>
      phpFetch(`/subscriptions/${id}`),
    );
    const subResults = await Promise.all(subPromises);
    subs = subResults
      .filter((r) => r.ok)
      .map((r) => r.data?.data || r.data);
  }

  // Enhance with members
  const result = [];
  for (const sub of subs) {
    const membersRes = await phpFetch(
      `/subscription-relations?subscriptionId=${sub.id}`,
    );
    const relations = membersRes.ok ? (membersRes.data?.data || []) : [];

    result.push({
      ...sub,
      members: relations.map((r) => ({
        id: r.id,
        userId: r.userId,
        isUser: r.isUser,
        userName: r.isUser === 1 ? r.userName : r.userName,
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

  const { name, billingPeriodStart, billingPeriodEnd, basePrice, members } =
    data;

  const subRes = await phpFetch("/subscriptions", {
    method: "POST",
    body: {
      name,
      billingPeriodStart: new Date(billingPeriodStart).toISOString(),
      billingPeriodEnd: new Date(billingPeriodEnd).toISOString(),
      basePrice: Number.parseFloat(basePrice),
    },
  });

  if (!subRes.ok) throw new Error("Failed to create subscription");
  const subscriptionId = subRes.data?.data?.id;

  if (members && Array.isArray(members)) {
    for (const member of members) {
      await phpFetch("/subscription-relations", {
        method: "POST",
        body: {
          subscriptionId,
          userId: member.isUser ? member.userId : null,
          isUser: member.isUser ? 1 : 0,
          userName: member.isUser ? null : member.userName,
          hasPaid: member.hasPaid ? 1 : 0,
        },
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

  await phpFetch(`/subscriptions/${id}`, {
    method: "PATCH",
    body: {
      name,
      billingPeriodStart: new Date(billingPeriodStart).toISOString(),
      billingPeriodEnd: new Date(billingPeriodEnd).toISOString(),
      basePrice: Number.parseFloat(basePrice),
    },
  });

  if (members && Array.isArray(members)) {
    // Delete existing relations
    const existingRes = await phpFetch(
      `/subscription-relations?subscriptionId=${id}`,
    );
    const existing = existingRes.ok ? (existingRes.data?.data || []) : [];
    for (const rel of existing) {
      await phpFetch(`/subscription-relations/${rel.id}`, { method: "DELETE" });
    }

    // Insert new members
    for (const member of members) {
      await phpFetch("/subscription-relations", {
        method: "POST",
        body: {
          subscriptionId: id,
          userId: member.isUser ? member.userId : null,
          isUser: member.isUser ? 1 : 0,
          userName: member.isUser ? null : member.userName,
          hasPaid: member.hasPaid ? 1 : 0,
        },
      });
    }
  }

  return true;
}

export async function deleteSubscription(id) {
  const session = await getSession();
  if (!session?.isAdmin) return null;

  const existingRes = await phpFetch(
    `/subscription-relations?subscriptionId=${id}`,
  );
  const existing = existingRes.ok ? (existingRes.data?.data || []) : [];
  for (const rel of existing) {
    await phpFetch(`/subscription-relations/${rel.id}`, { method: "DELETE" });
  }

  await phpFetch(`/subscriptions/${id}`, { method: "DELETE" });

  return true;
}
