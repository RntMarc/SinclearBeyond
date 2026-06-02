import { NextResponse } from "next/server";
import { getSessionWithSubs } from "@/lib/auth/sessionExtended";
import {
  getNewsArticles,
  getUpvoteCounts,
  getUpvotedArticleUrls,
} from "@/lib/news/actions";

export async function GET(request) {
  const session = await getSessionWithSubs();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1", 10);

  const [articles, upvotedUrls, upvoteCounts] = await Promise.all([
    getNewsArticles(page),
    getUpvotedArticleUrls(session.sub),
    getUpvoteCounts(),
  ]);

  const results = articles.map((article) => ({
    ...article,
    isUpvoted: upvotedUrls.includes(article.link),
    upvotes: upvoteCounts[article.link] || 0,
  }));

  return NextResponse.json(results);
}
