"use server";

import { revalidatePath } from "next/cache";
import sharp from "sharp";
import { getSession } from "@/lib/auth/session";
import { phpFetch } from "@/lib/api/phpClient";

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

  const result = await phpFetch("/forums", {
    method: "POST",
    body: { name, description, image },
  });

  if (!result.ok) throw new Error("Failed to create forum");

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

  const updateData = { name, description };

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

  const result = await phpFetch(`/forums/${id}`, {
    method: "PATCH",
    body: updateData,
  });

  if (!result.ok) throw new Error("Failed to update forum");

  revalidatePath("/admin");
  revalidatePath("/forum");
  revalidatePath(`/forum/${id}`);
  return { ok: true };
}

export async function deleteForum(id) {
  const session = await getSession();
  if (!session?.isAdmin) throw new Error("Unauthorized");

  // Delete related records via generic CRUD
  const postsRes = await phpFetch(`/posts?forumId=${id}`);
  if (postsRes.ok) {
    const posts = postsRes.data?.data || [];
    for (const post of posts) {
      await phpFetch(`/post-votes?postId=${post.id}`, { method: "DELETE" });
      await phpFetch(`/posts/${post.id}`, { method: "DELETE" });
    }
  }

  await phpFetch(`/forum-members?forumId=${id}`, { method: "DELETE" });
  await phpFetch("/notifications/read-type", {
    method: "POST",
    body: { type: ["forum"] },
  });
  await phpFetch(`/forums/${id}`, { method: "DELETE" });

  revalidatePath("/admin");
  revalidatePath("/forum");
  return { ok: true };
}

export async function joinForum(forumId) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const existing = await phpFetch("/forum-members", { silent: true });
  const allMembers = existing.ok ? (existing.data?.data || []) : [];
  const existingMember = allMembers.find(
    (m) => m.forumId === forumId && m.userId === session.sub,
  );

  if (existingMember) {
    return { ok: true, alreadyMember: true };
  }

  const result = await phpFetch("/forum-members", {
    method: "POST",
    body: { forumId, userId: session.sub },
  });

  if (!result.ok) throw new Error("Failed to join forum");

  revalidatePath("/forum");
  revalidatePath(`/forum/${forumId}`);
  return { ok: true };
}

export async function leaveForum(forumId) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const existing = await phpFetch("/forum-members", { silent: true });
  const allMembers = existing.ok ? (existing.data?.data || []) : [];
  const membership = allMembers.find(
    (m) => m.forumId === forumId && m.userId === session.sub,
  );

  if (membership) {
    await phpFetch(`/forum-members/${membership.id}`, { method: "DELETE" });
  }

  revalidatePath("/forum");
  revalidatePath(`/forum/${forumId}`);
  return { ok: true };
}

export async function votePost(postId) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const result = await phpFetch("/post-votes", {
    method: "POST",
    body: { postId, userId: session.sub, createdAt: new Date().toISOString() },
  });

  if (!result.ok) throw new Error("Failed to vote");

  const postRes = await phpFetch(`/posts/${postId}`);
  if (postRes.ok && postRes.data?.forumId) {
    revalidatePath(`/forum/${postRes.data.forumId}`);
  }

  return { ok: true };
}

export async function unvotePost(postId) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const existing = await phpFetch("/post-votes", { silent: true });
  const allVotes = existing.ok ? (existing.data?.data || []) : [];
  const vote = allVotes.find(
    (v) => v.postId === postId && v.userId === session.sub,
  );

  if (vote) {
    await phpFetch(`/post-votes/${vote.id}`, { method: "DELETE" });
  }

  const postRes = await phpFetch(`/posts/${postId}`);
  if (postRes.ok && postRes.data?.forumId) {
    revalidatePath(`/forum/${postRes.data.forumId}`);
  }

  return { ok: true };
}

export async function markForumAsRead(forumId) {
  const session = await getSession();
  if (!session) return { ok: false };

  await phpFetch("/notifications/read-type", {
    method: "POST",
    body: { type: ["forum"] },
  });

  revalidatePath("/forum");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function markPostAsRead(postId) {
  const session = await getSession();
  if (!session) return { ok: false };

  await phpFetch("/notifications/read-type", {
    method: "POST",
    body: { type: ["forum"] },
  });

  revalidatePath("/forum");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function getUnreadForumsCount() {
  const session = await getSession();
  if (!session) return 0;

  const result = await phpFetch("/notifications/badges");
  if (!result.ok) return 0;
  return result.data.data?.forum || 0;
}
