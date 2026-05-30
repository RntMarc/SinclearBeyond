"use server";

import { and, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import sharp from "sharp";
import { getSession } from "@/lib/auth/session";
import { db, safeQuery } from "@/lib/db/db";
import {
  feedPosts,
  feedPostVotes,
  forumMembers,
  forums,
  notifications,
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
  revalidatePath("/forum");
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
  revalidatePath("/forum");
  revalidatePath(`/forum/${id}`);
  return { ok: true };
}

export async function deleteForum(id) {
  const session = await getSession();
  if (!session?.isAdmin) throw new Error("Unauthorized");

  await safeQuery(
    db
      .delete(feedPostVotes)
      .where(
        sql`${feedPostVotes.postId} IN (SELECT id FROM ${feedPosts} WHERE ${feedPosts.forumId} = ${id})`,
      ),
  );
  await safeQuery(db.delete(feedPosts).where(eq(feedPosts.forumId, id)));
  await safeQuery(db.delete(forumMembers).where(eq(forumMembers.forumId, id)));
  await safeQuery(
    db
      .delete(notifications)
      .where(
        and(eq(notifications.type, "forum"), eq(notifications.entityId, id)),
      ),
  );
  const { error } = await safeQuery(db.delete(forums).where(eq(forums.id, id)));

  if (error) throw error;

  revalidatePath("/admin");
  revalidatePath("/forum");
  return { ok: true };
}

export async function joinForum(forumId) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  // Check if already a member
  const { data: existing } = await safeQuery(
    db
      .select()
      .from(forumMembers)
      .where(
        and(
          eq(forumMembers.forumId, forumId),
          eq(forumMembers.userId, session.sub),
        ),
      )
      .limit(1),
  );

  if (existing?.length > 0) {
    return { ok: true, alreadyMember: true };
  }

  const { error } = await safeQuery(
    db.insert(forumMembers).values({
      id: crypto.randomUUID(),
      forumId,
      userId: session.sub,
      createdAt: new Date(),
    }),
  );

  if (error) throw error;

  revalidatePath("/forum");
  revalidatePath(`/forum/${forumId}`);
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

  revalidatePath("/forum");
  revalidatePath(`/forum/${forumId}`);
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
    revalidatePath(`/forum/${data[0].forumId}`);
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
    revalidatePath(`/forum/${data[0].forumId}`);
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

  await safeQuery(
    db
      .delete(notifications)
      .where(
        and(
          eq(notifications.userId, session.sub),
          eq(notifications.type, "forum"),
          inArray(notifications.entityId, postIds),
        ),
      ),
  );

  revalidatePath("/forum");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function markPostAsRead(postId) {
  const session = await getSession();
  if (!session) return { ok: false };

  await safeQuery(
    db
      .delete(notifications)
      .where(
        and(
          eq(notifications.userId, session.sub),
          eq(notifications.type, "forum"),
          eq(notifications.entityId, postId),
        ),
      ),
  );

  revalidatePath("/forum");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function getUnreadForumsCount() {
  const session = await getSession();
  if (!session) return 0;

  const { data, error } = await safeQuery(
    db
      .select({ count: sql`count(*)` })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, session.sub),
          eq(notifications.type, "forum"),
        ),
      ),
  );

  if (error) return 0;
  return Number(data?.[0]?.count || 0);
}
