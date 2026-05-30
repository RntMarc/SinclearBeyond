import { and, count, desc, eq, inArray, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth/session";
import { db, safeQuery } from "@/lib/db/db";
import {
  changelogEntries,
  events,
  feedPosts,
  notifications,
  polls,
  travelEvents,
  travelTrips,
  users,
} from "@/lib/db/schema";

export async function GET(req) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const isAdminRequest = searchParams.get("admin") === "true";

  if (isAdminRequest) {
    if (!session.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: total } = await safeQuery(
      db.select({ value: count() }).from(notifications),
    );
    const { data: byType } = await safeQuery(
      db
        .select({ type: notifications.type, value: count() })
        .from(notifications)
        .groupBy(notifications.type),
    );

    const typeMap = {};
    for (const row of byType || []) {
      typeMap[row.type] = row.value;
    }

    return NextResponse.json({
      total: total?.[0]?.value || 0,
      byType: typeMap,
    });
  }

  const userId = session.sub;
  const t = await getTranslations("Notifications");

  const { data: notificationRows, error } = await safeQuery(
    db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt)),
  );

  if (error) {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  if (!notificationRows || notificationRows.length === 0) {
    return NextResponse.json([]);
  }

  // Batch enrichment logic
  const typeMap = notificationRows.reduce((acc, n) => {
    if (!acc[n.type]) acc[n.type] = [];
    acc[n.type].push(n.entityId);
    return acc;
  }, {});

  const dataContext = {};

  // Fetch all necessary data in parallel batches
  const fetchPromises = [];

  if (typeMap.forum) {
    fetchPromises.push(
      safeQuery(
        db
          .select({
            id: feedPosts.id,
            forumId: feedPosts.forumId,
            authorId: feedPosts.userId,
            authorName: users.displayName,
          })
          .from(feedPosts)
          .leftJoin(users, eq(feedPosts.userId, users.id))
          .where(inArray(feedPosts.id, typeMap.forum)),
      ).then(({ data }) => {
        dataContext.forum = (data || []).reduce((acc, row) => {
          acc[row.id] = row;
          return acc;
        }, {});
      }),
    );
  }

  if (typeMap.poll) {
    fetchPromises.push(
      safeQuery(
        db.select().from(polls).where(inArray(polls.id, typeMap.poll)),
      ).then(({ data }) => {
        dataContext.poll = (data || []).reduce((acc, row) => {
          acc[row.id] = row;
          return acc;
        }, {});
      }),
    );
  }

  if (typeMap.event) {
    fetchPromises.push(
      safeQuery(
        db.select().from(events).where(inArray(events.id, typeMap.event)),
      ).then(({ data }) => {
        dataContext.event = (data || []).reduce((acc, row) => {
          acc[row.id] = row;
          return acc;
        }, {});
      }),
      safeQuery(
        db
          .select()
          .from(travelEvents)
          .where(inArray(travelEvents.id, typeMap.event)),
      ).then(({ data }) => {
        dataContext.travelEvent = (data || []).reduce((acc, row) => {
          acc[row.id] = row;
          return acc;
        }, {});
      }),
    );
  }

  if (typeMap.trip) {
    fetchPromises.push(
      safeQuery(
        db
          .select()
          .from(travelTrips)
          .where(inArray(travelTrips.id, typeMap.trip)),
      ).then(({ data }) => {
        dataContext.trip = (data || []).reduce((acc, row) => {
          acc[row.id] = row;
          return acc;
        }, {});
      }),
    );
  }

  if (typeMap.changelog) {
    fetchPromises.push(
      safeQuery(
        db
          .select()
          .from(changelogEntries)
          .where(inArray(changelogEntries.id, typeMap.changelog)),
      ).then(({ data }) => {
        dataContext.changelog = (data || []).reduce((acc, row) => {
          acc[row.id] = row;
          return acc;
        }, {});
      }),
    );
  }

  if (typeMap.birthday || typeMap.birthday_soon) {
    const bdayEntityIds = [
      ...(typeMap.birthday || []),
      ...(typeMap.birthday_soon || []),
    ];
    const userIds = bdayEntityIds.map((eid) => eid.split("-")[1]);
    if (userIds.length > 0) {
      fetchPromises.push(
        safeQuery(
          db.select().from(users).where(inArray(users.id, userIds)),
        ).then(({ data }) => {
          dataContext.user = (data || []).reduce((acc, row) => {
            acc[row.id] = row;
            return acc;
          }, {});
        }),
      );
    }
  }

  await Promise.all(fetchPromises);

  const enriched = notificationRows.map((n) => {
    let title = t(`types.${n.type}`);
    let link = "/home";

    try {
      if (n.type === "forum" && dataContext.forum?.[n.entityId]) {
        const post = dataContext.forum[n.entityId];
        title = `${t("types.forum")}: ${post.authorName || post.authorId}`;
        link = `/forum/${post.forumId}`;
      } else if (n.type === "poll" && dataContext.poll?.[n.entityId]) {
        title = `${t("types.poll")}: ${dataContext.poll[n.entityId].title}`;
        link = "/umfrage";
      } else if (n.type === "event") {
        if (dataContext.event?.[n.entityId]) {
          title = `${t("types.event")}: ${dataContext.event[n.entityId].title}`;
          link = "/kalender";
        } else if (dataContext.travelEvent?.[n.entityId]) {
          const te = dataContext.travelEvent[n.entityId];
          title = `${t("types.event")}: ${te.name}`;
          link = te.tripId ? `/reisen/${te.tripId}` : "/reisen";
        }
      } else if (n.type === "trip" && dataContext.trip?.[n.entityId]) {
        title = `${t("types.trip")}: ${dataContext.trip[n.entityId].name}`;
        link = "/reisen";
      } else if (
        n.type === "changelog" &&
        dataContext.changelog?.[n.entityId]
      ) {
        title = `${t("types.changelog")}: ${dataContext.changelog[n.entityId].title}`;
        link = "/info";
      } else if (n.type === "birthday" || n.type === "birthday_soon") {
        const bUserId = n.entityId.split("-")[1];
        const user = dataContext.user?.[bUserId];
        title = `${t(`types.${n.type}`)}: ${user?.displayName || "Nutzer"}`;
        link = "/geburtstage";
      }
    } catch (e) {
      console.error("Error enriching notification", e);
    }

    return { ...n, title, link };
  });

  return NextResponse.json(enriched);
}

export async function DELETE(req) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const all = searchParams.get("all") === "true";
  const type = searchParams.get("type");

  if (all && type) {
    await safeQuery(
      db
        .delete(notifications)
        .where(
          and(
            eq(notifications.userId, session.sub),
            eq(notifications.type, type),
          ),
        ),
    );
  } else if (all) {
    await safeQuery(
      db.delete(notifications).where(eq(notifications.userId, session.sub)),
    );
  } else if (id) {
    await safeQuery(
      db
        .delete(notifications)
        .where(
          and(eq(notifications.id, id), eq(notifications.userId, session.sub)),
        ),
    );
  }

  return NextResponse.json({ ok: true });
}
