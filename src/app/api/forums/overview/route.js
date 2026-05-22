import { and, desc, eq, gte, inArray, lt, notInArray, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db, safeQuery } from "@/lib/db/db";
import { feedPosts, forumMembers, forums, readStatuses, users } from "@/lib/db/schema";

export async function GET(req) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.sub;
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  try {
    // 1. Get joined forums
    const { data: joinedRows } = await safeQuery(
      db.select({ forum: forums })
        .from(forumMembers)
        .innerJoin(forums, eq(forumMembers.forumId, forums.id))
        .where(eq(forumMembers.userId, userId))
        .orderBy(desc(forums.name))
    );
    const joined = joinedRows?.map(r => r.forum) || [];
    const joinedIds = joined.map(f => f.id);

    // 2. Get not joined forums
    let notJoined = [];
    if (joinedIds.length > 0) {
      const { data: notJoinedRows } = await safeQuery(
        db.select().from(forums).where(notInArray(forums.id, joinedIds)).orderBy(desc(forums.name))
      );
      notJoined = notJoinedRows || [];
    } else {
      const { data: notJoinedRows } = await safeQuery(
        db.select().from(forums).orderBy(desc(forums.name))
      );
      notJoined = notJoinedRows || [];
    }

    // 3. For joined forums, count posts in last 7 days and check unread
    const enrichedJoined = await Promise.all(joined.map(async (forum) => {
      const { data: countData } = await safeQuery(
        db.select({ count: sql`count(*)` })
          .from(feedPosts)
          .where(and(
            eq(feedPosts.forumId, forum.id),
            gte(feedPosts.createdAt, sevenDaysAgo)
          ))
      );
      const postCount = Number(countData?.[0]?.count || 0);

      // Unread logic: are there any posts in this forum that the user hasn't read?
      const { data: unreadData } = await safeQuery(
        db.select({ id: feedPosts.id })
          .from(feedPosts)
          .where(and(
            eq(feedPosts.forumId, forum.id),
            sql`${feedPosts.id} NOT IN (
              SELECT entityId FROM ReadStatus
              WHERE userId = ${userId} AND entityType = 'feedPost'
            )`
          ))
          .limit(1)
      );
      const hasUnread = (unreadData?.length || 0) > 0;

      return { ...forum, postCount, hasUnread };
    }));

    return NextResponse.json({
      joined: enrichedJoined,
      notJoined
    });
  } catch (error) {
    console.error("[API/Forums/Overview] GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
