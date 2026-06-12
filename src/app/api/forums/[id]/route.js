import { and, desc, eq, inArray, or, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db, safeQuery } from "@/lib/db/db";
import {
  feedPosts,
  forumMembers,
  forums,
  users,
} from "@/lib/db/schema";
import { getWhoMarkedMe } from "@/lib/profile/closeFriends";

export async function GET(_req, { params }) {
  const { id: forumId } = await params;
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.sub;

  try {
    // 1. Get Forum Info
    const { data: forumData } = await safeQuery(
      db.select().from(forums).where(eq(forums.id, forumId)).limit(1),
    );
    if (!forumData?.[0])
      return NextResponse.json({ error: "Forum not found" }, { status: 404 });
    const forum = forumData[0];

    // 2. Get Membership status
    const { data: membershipData } = await safeQuery(
      db
        .select()
        .from(forumMembers)
        .where(
          and(
            eq(forumMembers.forumId, forumId),
            eq(forumMembers.userId, userId),
          ),
        )
        .limit(1),
    );
    const isMember = (membershipData?.length || 0) > 0;

    // 3. Get Members
    const { data: membersRows } = await safeQuery(
      db
        .select({
          id: users.id,
          displayName: users.displayName,
          image: users.image,
        })
        .from(forumMembers)
        .innerJoin(users, eq(forumMembers.userId, users.id))
        .where(eq(forumMembers.forumId, forumId)),
    );
    const members = membersRows || [];

    // 4. Get Posts (using visibility logic)
    const whoMarkedMe = await getWhoMarkedMe();
    const usersWhoMarkedMeIds = whoMarkedMe.map((r) => r.userId);

    const visibilityConditions = [
      eq(feedPosts.visibility, 1),
      eq(feedPosts.userId, userId),
    ];
    if (usersWhoMarkedMeIds.length > 0) {
      visibilityConditions.push(
        and(
          eq(feedPosts.visibility, 2),
          inArray(feedPosts.userId, usersWhoMarkedMeIds),
        ),
      );
    }

    const postsQuery = db
      .select({
        post: feedPosts,
        user: {
          id: users.id,
          displayName: users.displayName,
          image: users.image,
        },
        voteCount: sql`(SELECT count(*) FROM FeedPostVote WHERE postId = ${feedPosts.id})`,
        hasVoted: sql`(SELECT count(*) FROM FeedPostVote WHERE postId = ${feedPosts.id} AND userId = ${userId})`,
      })
      .from(feedPosts)
      .innerJoin(users, eq(feedPosts.userId, users.id))
      .where(and(eq(feedPosts.forumId, forumId), or(...visibilityConditions)))
      .orderBy(desc(feedPosts.createdAt));

    const { data: postsRows, error: postsErr } = await safeQuery(postsQuery);
    if (postsErr) throw postsErr;

    const posts = (postsRows || []).map((row) => ({
      ...row.post,
      user: row.user,
      voteCount: Number(row.voteCount),
      hasVoted: Number(row.hasVoted) > 0,
      canEdit: row.post.userId === userId,
    }));

    return NextResponse.json({
      forum,
      isMember,
      members,
      posts,
    });
  } catch (error) {
    console.error("[API/Forums/[id]] GET Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
