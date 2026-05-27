"use server";

import { and, desc, eq, gte, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, safeQuery } from "@/lib/db/db";
import { newsArticles, newsUpvotes, rssSources } from "@/lib/db/schema";
import { fetchRssFeed } from "./rss";

// ── RSS Sources (Admin) ───────────────────────────────────────────────────────

export async function getRssSources() {
  const result = await safeQuery(db.select().from(rssSources));
  return result.data || [];
}

export async function createRssSource(data) {
  const id = crypto.randomUUID();
  await safeQuery(
    db.insert(rssSources).values({
      id,
      name: data.name,
      url: data.url,
      itemsPerPage: data.itemsPerPage || 10,
      createdAt: new Date(),
    }),
  );
  revalidatePath("/admin");
  revalidatePath("/aktuell");
}

export async function updateRssSource(id, data) {
  await safeQuery(
    db
      .update(rssSources)
      .set({
        name: data.name,
        url: data.url,
        itemsPerPage: data.itemsPerPage,
      })
      .where(eq(rssSources.id, id)),
  );
  revalidatePath("/admin");
  revalidatePath("/aktuell");
}

export async function deleteRssSource(id) {
  await safeQuery(db.delete(rssSources).where(eq(rssSources.id, id)));
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
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const result = await safeQuery(
    db
      .select({
        id: newsArticles.id,
        title: newsArticles.title,
        url: newsArticles.url,
        sourceName: newsArticles.sourceName,
        sourceIcon: newsArticles.sourceIcon,
        savedAt: newsArticles.savedAt,
        upvoteCount: sql`CAST(COUNT(${newsUpvotes.id}) AS SIGNED)`.as(
          "upvoteCount",
        ),
      })
      .from(newsArticles)
      .leftJoin(newsUpvotes, eq(newsArticles.id, newsUpvotes.articleId))
      .where(gte(newsArticles.savedAt, sevenDaysAgo))
      .groupBy(newsArticles.id)
      .orderBy(desc(sql`upvoteCount`), desc(newsArticles.savedAt)),
  );

  return (result.data || []).map((r) => ({
    ...r,
    savedAt: r.savedAt instanceof Date ? r.savedAt.toISOString() : r.savedAt,
  }));
}

export async function getArchivedNews() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const result = await safeQuery(
    db
      .select({
        id: newsArticles.id,
        title: newsArticles.title,
        url: newsArticles.url,
        sourceName: newsArticles.sourceName,
        sourceIcon: newsArticles.sourceIcon,
        savedAt: newsArticles.savedAt,
        upvoteCount: sql`CAST(COUNT(${newsUpvotes.id}) AS SIGNED)`.as(
          "upvoteCount",
        ),
      })
      .from(newsArticles)
      .leftJoin(newsUpvotes, eq(newsArticles.id, newsUpvotes.articleId))
      .where(sql`${newsArticles.savedAt} < ${sevenDaysAgo}`)
      .groupBy(newsArticles.id)
      .orderBy(desc(newsArticles.savedAt)),
  );

  return (result.data || []).map((r) => ({
    ...r,
    savedAt: r.savedAt instanceof Date ? r.savedAt.toISOString() : r.savedAt,
  }));
}

export async function upvoteArticle(article, userId) {
  const dbArticle = await safeQuery(
    db.select().from(newsArticles).where(eq(newsArticles.url, article.link)),
  );

  let articleId;
  if (!dbArticle.data || dbArticle.data.length === 0) {
    articleId = crypto.randomUUID();
    await safeQuery(
      db.insert(newsArticles).values({
        id: articleId,
        title: article.title,
        url: article.link,
        sourceName: article.sourceName,
        sourceIcon: article.sourceIcon,
        savedAt: new Date(),
      }),
    );
  } else {
    articleId = dbArticle.data[0].id;
  }

  const existingUpvote = await safeQuery(
    db
      .select()
      .from(newsUpvotes)
      .where(
        and(
          eq(newsUpvotes.articleId, articleId),
          eq(newsUpvotes.userId, userId),
        ),
      ),
  );

  if (!existingUpvote.data || existingUpvote.data.length === 0) {
    await safeQuery(
      db.insert(newsUpvotes).values({
        id: crypto.randomUUID(),
        articleId,
        userId,
        createdAt: new Date(),
      }),
    );
  }

  revalidatePath("/aktuell");
}

export async function getUpvotedArticleUrls(userId) {
  const result = await safeQuery(
    db
      .select({ url: newsArticles.url })
      .from(newsArticles)
      .innerJoin(newsUpvotes, eq(newsArticles.id, newsUpvotes.articleId))
      .where(eq(newsUpvotes.userId, userId)),
  );
  return (result.data || []).map((r) => r.url);
}

export async function getUpvoteCounts() {
  const result = await safeQuery(
    db
      .select({
        url: newsArticles.url,
        count: sql`CAST(COUNT(${newsUpvotes.id}) AS SIGNED)`,
      })
      .from(newsArticles)
      .leftJoin(newsUpvotes, eq(newsArticles.id, newsUpvotes.articleId))
      .groupBy(newsArticles.url),
  );

  const counts = {};
  (result.data || []).forEach((r) => {
    counts[r.url] = r.count;
  });
  return counts;
}
