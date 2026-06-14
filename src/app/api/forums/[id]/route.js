import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { phpFetch } from "@/lib/api/phpClient";

export async function GET(_req, { params }) {
  const { id: forumId } = await params;
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const [forumRes, postsRes, membersRes] = await Promise.all([
      phpFetch(`/forums/${forumId}`, { silent: true }),
      phpFetch(`/posts?forumId=${forumId}`),
      phpFetch(`/forum-members?forumId=${forumId}`),
    ]);

    if (!forumRes.ok) {
      return NextResponse.json(
        { error: "Forum not found" },
        { status: 404 },
      );
    }

    const forum = forumRes.data?.data || forumRes.data;
    const posts = postsRes.ok ? (postsRes.data?.data || []) : [];
    const memberRecords = membersRes.ok ? (membersRes.data?.data || []) : [];

    const userIds = [
      ...new Set([
        ...memberRecords.map((m) => m.userId),
        ...posts.map((p) => p.userId).filter(Boolean),
      ]),
    ];

    const userMap = {};
    if (userIds.length > 0) {
      const users = await Promise.all(
        userIds.map((uid) => phpFetch(`/users/${uid}`, { silent: true })),
      );
      for (const u of users) {
        if (u.ok) {
          const userData = u.data?.data || u.data;
          if (userData?.id) {
            userMap[userData.id] = userData;
          }
        }
      }
    }

    const userVotesRes = await phpFetch(`/post-votes?userId=${session.sub}`, {
      silent: true,
    });
    const allUserVotes = userVotesRes.ok
      ? (userVotesRes.data?.data || [])
      : [];
    const votedPostIds = new Set(
      allUserVotes.filter((v) => v.postId).map((v) => v.postId),
    );

    const postsWithUser = posts.map((post) => ({
      ...post,
      user: post.user || userMap[post.userId] || null,
      hasVoted: votedPostIds.has(post.id),
      canEdit: post.userId === session.sub || session.isAdmin,
      voteCount: post.voteCount ?? 0,
    }));

    const members = memberRecords.map((m) => userMap[m.userId]).filter(Boolean);

    const isMember = memberRecords.some((m) => m.userId === session.sub);

    return NextResponse.json({
      forum,
      posts: postsWithUser,
      members,
      isMember,
    });
  } catch (error) {
    console.error("[API/Forums/[id]] GET Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
