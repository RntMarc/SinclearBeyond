import { and, desc, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db, safeQuery } from "@/lib/db/db";
import { feedPosts, forumMembers, forums, readStatuses } from "@/lib/db/schema";

export async function GET() {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.sub;

  try {
    // 1. Get all forums where user is member
    const { data: joined, error: joinedError } = await safeQuery(
      db
        .select({
          id: forums.id,
          name: forums.name,
          description: forums.description,
          image: forums.image,
          postCount: sql`CAST((SELECT count(*) FROM ${feedPosts} WHERE ${feedPosts.forumId} = ${forums.id}) AS SIGNED)`,
          hasUnread: sql`EXISTS (
            SELECT 1 FROM ${feedPosts}
            LEFT JOIN ${readStatuses} ON ${readStatuses.entityId} = ${feedPosts.id}
              AND ${readStatuses.entityType} = 'feedPost'
              AND ${readStatuses.userId} = ${userId}
            WHERE ${feedPosts.forumId} = ${forums.id} AND ${readStatuses.id} IS NULL
          )`,
        })
        .from(forums)
        .innerJoin(forumMembers, eq(forumMembers.forumId, forums.id))
        .where(eq(forumMembers.userId, userId))
        .orderBy(desc(forums.createdAt)),
    );

    if (joinedError) {
      return NextResponse.json(
        { error: "Failed to fetch joined forums" },
        { status: 500 },
      );
    }

    // 2. Get all other forums
    const joinedIds = (joined || []).map((f) => f.id);
    const { data: allForums, error: allForumsError } = await safeQuery(
      db
        .select({
          id: forums.id,
          name: forums.name,
          description: forums.description,
          image: forums.image,
        })
        .from(forums),
    );

    if (allForumsError) {
      return NextResponse.json(
        { error: "Failed to fetch all forums" },
        { status: 500 },
      );
    }

    const notJoined = (allForums || []).filter(
      (f) => !joinedIds.includes(f.id),
    );

    return NextResponse.json({
      joined: joined || [],
      notJoined: notJoined || [],
    });
  } catch (error) {
    console.error("[API/Forums/Overview] Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
