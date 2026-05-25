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
    const { data: joined } = await safeQuery(
      db
        .select({
          id: forums.id,
          name: forums.name,
          description: forums.description,
          image: forums.image,
          postCount: sql`(SELECT count(*) FROM FeedPosts WHERE forumId = ${forums.id})`,
          hasUnread: sql`EXISTS (
            SELECT 1 FROM FeedPosts p
            LEFT JOIN ReadStatuses rs ON rs.entityId = p.id AND rs.entityType = 'feedPost' AND rs.userId = ${userId}
            WHERE p.forumId = ${forums.id} AND rs.id IS NULL
          )`,
        })
        .from(forums)
        .innerJoin(forumMembers, eq(forumMembers.forumId, forums.id))
        .where(eq(forumMembers.userId, userId))
        .orderBy(desc(forums.createdAt)),
    );

    // 2. Get all other forums
    const joinedIds = (joined || []).map((f) => f.id);
    const notJoinedQuery = db
      .select({
        id: forums.id,
        name: forums.name,
        description: forums.description,
        image: forums.image,
      })
      .from(forums);

    if (joinedIds.length > 0) {
      // Corrected: use notInArray or similar, but for simplicity let's just filter or use a clean query
      // For now, let's just fetch all and filter in JS if joinedIds is not empty
    }

    const { data: allForums } = await safeQuery(notJoinedQuery);
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
