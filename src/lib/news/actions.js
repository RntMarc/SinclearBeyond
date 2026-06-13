"use server";

import { revalidatePath } from "next/cache";
import { phpFetch } from "@/lib/api/phpClient";
import { fetchRssFeed } from "./rss";

// ── RSS Sources (Admin) ───────────────────────────────────────────────────────

export async function getRssSources() {
  const result = await phpFetch("/rss-sources");
  if (!result.ok) return [];
  return result.data?.data || [];
}

export async function createRssSource(data) {
  await phpFetch("/rss-sources", {
    method: "POST",
    body: data,
  });
  revalidatePath("/admin");
  revalidatePath("/aktuell");
}

export async function updateRssSource(id, data) {
  await phpFetch(`/rss-sources/${id}`, {
    method: "PATCH",
    body: data,
  });
  revalidatePath("/admin");
  revalidatePath("/aktuell");
}

export async function deleteRssSource(id) {
  await phpFetch(`/rss-sources/${id}`, { method: "DELETE" });
  revalidatePath("/admin");
  revalidatePath("/aktuell");
}

// ── News Logic ────────────────────────────────────────────────────────────────

export async function getNewsArticles(page = 1) {
  const sources = await getRssSources();
  let allItems = [];

  for (const source of sources) {
    try {
      const { items } = await fetchRssFeed(source.url);
      const start = (page - 1) * source.itemsPerPage;
      const end = start + source.itemsPerPage;
      const sourceItems = (items || []).slice(start, end).map((item) => ({
        ...item,
        sourceId: source.id,
        itemsPerPage: source.itemsPerPage,
      }));
      allItems = [...allItems, ...sourceItems];
    } catch (e) {
      console.error(`Error processing source ${source.name}:`, e);
    }
  }

  const sourceGroups = sources.map((s) =>
    allItems.filter((i) => i.sourceId === s.id),
  );

  if (sourceGroups.length === 0) return [];

  const interleaved = [];
  const maxLen = Math.max(...sourceGroups.map((g) => g.length));
  for (let i = 0; i < maxLen; i++) {
    for (const group of sourceGroups) {
      if (group[i]) interleaved.push(group[i]);
    }
  }

  return interleaved;
}

export async function getImportantNews() {
  const result = await phpFetch("/news/important");
  if (!result.ok) return [];
  return (result.data?.data || []).map((r) => ({
    ...r,
    savedAt: r.savedAt instanceof Date ? r.savedAt.toISOString() : r.savedAt,
  }));
}

export async function getArchivedNews() {
  const result = await phpFetch("/news/archived");
  if (!result.ok) return [];
  return (result.data?.data || []).map((r) => ({
    ...r,
    savedAt: r.savedAt instanceof Date ? r.savedAt.toISOString() : r.savedAt,
  }));
}

export async function upvoteArticle(article, userId) {
  const result = await phpFetch("/news/upvote", {
    method: "POST",
    body: {
      link: article.link,
      title: article.title,
      sourceName: article.sourceName,
      sourceIcon: article.sourceIcon,
    },
  });

  if (!result.ok) {
    console.error("[News/Upvote] Failed:", result.error);
  }

  revalidatePath("/aktuell");
}

export async function getUpvotedArticleUrls(userId) {
  const result = await phpFetch("/news/upvoted");
  if (!result.ok) return [];
  return result.data?.data || [];
}

export async function getUpvoteCounts() {
  const result = await phpFetch("/news/upvote-counts");
  if (!result.ok) return {};
  return result.data?.data || {};
}
