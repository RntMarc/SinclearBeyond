"use server";

import { and, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import sharp from "sharp";
import { getSession } from "@/lib/auth/session";
import { db, safeQuery } from "@/lib/db/db";
import {
  feedPostVotes,
  feedPosts,
  forumMembers,
  forums,
  readStatuses,
} from "@/lib/db/schema";

export async function createForum(formData) {
  const session = await getSession();
  if (!session?.isAdmin) throw new Error("Unauthorized");

  const name = formData.get("name")?.toString();
  const description = formData.get("description")?.toString();
  const imageFile = formData.get("image");

  let image = null;
  if (imageFile && imageFile.size > 0) {
    const buffer = await imageFile.arrayBuffer();
    const processedBuffer = await sharp(Buffer.from(buffer))
      .resize(265, 265)
      .jpeg({ quality: 70 })
      .toBuffer();
    image = `data:image/jpeg;base64,${processedBuffer.toString("base64")}`;
  }

  const id = crypto.randomUUID();
  const now = new Date();

  const { error } = await safeQuery(
    db.insert(forums).values({
      id,
      name,
      description,
      image,
      createdAt: now,
      updatedAt: now,
    }),
  );

  if (error) throw error;

  revalidatePath("/admin");
  revalidatePath("/feed");
  return { ok: true };
}

export async function updateForum(id, formData) {
  const session = await getSession();
  if (!session?.isAdmin) throw new Error("Unauthorized");

  const name = formData.get("name")?.toString();
  const description = formData.get("description")?.toString();
  const imageFile = formData.get("image");
  const removeImage = formData.get("removeImage") === "true";

  const updateData = {
    name,
    description,
    updatedAt: new Date(),
  };

  if (removeImage) {
    updateData.image = null;
  } else if (imageFile && imageFile.size > 0) {
    const buffer = await imageFile.arrayBuffer();
    const processedBuffer = await sharp(Buffer.from(buffer))
      .resize(265, 265)
      .jpeg({ quality: 70 })
      .toBuffer();
    updateData.image = `data:image/jpeg;base64,${processedBuffer.toString("base64")}`;
  }

  const { error } = await safeQuery(
    db.update(forums).set(updateData).where(eq(forums.id, id)),
  );

  if (error) throw error;

  revalidatePath("/admin");
  revalidatePath("/feed");
  revalidatePath(`/feed/${id}`);
  return { ok: true };
}

export async function deleteForum(id) {
  const session = await getSession();
  if (!session?.isAdmin) throw new Error("Unauthorized");

  // Deletions should be handled carefully
  // 1. Delete votes of posts in this forum
  // 2. Delete posts in this forum
  // 3. Delete forum members
  // 4. Delete read statuses
  // 5. Delete forum

  await safeQuery(
    db
      .delete(feedPostVotes)
      .where(
        sql`${feedPostVotes.postId} IN (SELECT id FROM FeedPosts WHERE forumId = ${id})`,
      ),
  );
  await safeQuery(db.delete(feedPosts).where(eq(feedPosts.forumId, id)));
  await safeQuery(db.delete(forumMembers).where(eq(forumMembers.forumId, id)));
  await safeQuery(
    db
      .delete(readStatuses)
      .where(
        and(
          eq(readStatuses.entityType, "forum"),
          eq(readStatuses.entityId, id),
        ),
      ),
  );
  const { error } = await safeQuery(db.delete(forums).where(eq(forums.id, id)));

  if (error) throw error;

  revalidatePath("/admin");
  revalidatePath("/feed");
  return { ok: true };
}

export async function joinForum(forumId) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const { error } = await safeQuery(
    db.insert(forumMembers).values({
      id: crypto.randomUUID(),
      forumId,
      userId: session.sub,
      createdAt: new Date(),
    }),
  );

  if (error) throw error;

  revalidatePath("/feed");
  revalidatePath(`/feed/${forumId}`);
  return { ok: true };
}

export async function leaveForum(forumId) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const { error } = await safeQuery(
    db
      .delete(forumMembers)
      .where(
        and(
          eq(forumMembers.forumId, forumId),
          eq(forumMembers.userId, session.sub),
        ),
      ),
  );

  if (error) throw error;

  revalidatePath("/feed");
  revalidatePath(`/feed/${forumId}`);
  return { ok: true };
}

export async function votePost(postId) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const { error } = await safeQuery(
    db.insert(feedPostVotes).values({
      id: crypto.randomUUID(),
      postId,
      userId: session.sub,
      createdAt: new Date(),
    }),
  );

  if (error) throw error;

  // We need the forumId to revalidate.
  const { data } = await safeQuery(
    db
      .select({ forumId: feedPosts.forumId })
      .from(feedPosts)
      .where(eq(feedPosts.id, postId))
      .limit(1),
  );
  if (data?.[0]) {
    revalidatePath(`/feed/${data[0].forumId}`);
  }

  return { ok: true };
}

export async function unvotePost(postId) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const { error } = await safeQuery(
    db
      .delete(feedPostVotes)
      .where(
        and(
          eq(feedPostVotes.postId, postId),
          eq(feedPostVotes.userId, session.sub),
        ),
      ),
  );

  if (error) throw error;

  const { data } = await safeQuery(
    db
      .select({ forumId: feedPosts.forumId })
      .from(feedPosts)
      .where(eq(feedPosts.id, postId))
      .limit(1),
  );
  if (data?.[0]) {
    revalidatePath(`/feed/${data[0].forumId}`);
  }

  return { ok: true };
}

export async function markForumAsRead(forumId) {
  const session = await getSession();
  if (!session) return { ok: false };

  // Get all post IDs in this forum
  const { data: posts, error: postsErr } = await safeQuery(
    db
      .select({ id: feedPosts.id })
      .from(feedPosts)
      .where(eq(feedPosts.forumId, forumId)),
  );
  if (postsErr) throw postsErr;

  const postIds = (posts || []).map((p) => p.id);
  if (postIds.length === 0) return { ok: true };

  // Use readStatuses for tracking unread?
  // User said "Ein Besuch genügt, um den Post als gelesen zu markieren. Also genau wie im Changelog."
  // In changelog, every entry is marked as read in readStatuses.

  // Actually, for forums, it might be easier to just store "last visited at" for each forum member?
  // But user specifically said "Nutze dafür das gleiche System wie für die Ungelesen-Markierung von /info."
  // /info uses readStatuses per changelog entry.

  const { data: alreadyRead, error: readErr } = await safeQuery(
    db
      .select({ entityId: readStatuses.entityId })
      .from(readStatuses)
      .where(
        and(
          eq(readStatuses.userId, session.sub),
          eq(readStatuses.entityType, "feedPost"),
        ),
      ),
  );
  if (readErr) throw readErr;

  const alreadyReadIds = new Set((alreadyRead || []).map((r) => r.entityId));
  const unreadIds = postIds.filter((id) => !alreadyReadIds.has(id));

  if (unreadIds.length > 0) {
    const values = unreadIds.map((id) => ({
      id: crypto.randomUUID(),
      userId: session.sub,
      entityType: "feedPost",
      entityId: id,
      createdAt: new Date(),
    }));
    await safeQuery(db.insert(readStatuses).values(values));
  }

  revalidatePath("/feed");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function getUnreadForumsCount() {
  const session = await getSession();
  if (!session) return 0;

  // 1. Get all joined forums
  const { data: joinedForums, error: joinedErr } = await safeQuery(
    db
      .select({ forumId: forumMembers.forumId })
      .from(forumMembers)
      .where(eq(forumMembers.userId, session.sub)),
  );
  if (joinedErr || !joinedForums?.length) return 0;

  const forumIds = joinedForums.map((f) => f.forumId);

  // 2. Get all posts in these forums
  const { data: posts, error: postsErr } = await safeQuery(
    db
      .select({ id: feedPosts.id })
      .from(feedPosts)
      .where(inArray(feedPosts.forumId, forumIds)),
  );
  if (postsErr || !posts?.length) return 0;

  const postIds = posts.map((p) => p.id);

  // 3. Get read statuses for these posts
  const { data: readPosts, error: readErr } = await safeQuery(
    db
      .select({ entityId: readStatuses.entityId })
      .from(readStatuses)
      .where(
        and(
          eq(readStatuses.userId, session.sub),
          eq(readStatuses.entityType, "feedPost"),
          inArray(readStatuses.entityId, postIds),
        ),
      ),
  );
  if (readErr) return 0;

  const readIds = new Set((readPosts || []).map((r) => r.entityId));
  const unreadCount = postIds.filter((id) => !readIds.has(id)).length;

  return unreadCount;
}
