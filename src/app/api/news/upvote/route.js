import { NextResponse } from "next/server";
import { getSessionWithSubs } from "@/lib/auth/sessionExtended";
import { upvoteArticle } from "@/lib/news/actions";

export async function POST(request) {
  const session = await getSessionWithSubs();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { article } = body;

  if (!article)
    return NextResponse.json({ error: "Missing article" }, { status: 400 });

  await upvoteArticle(article, session.sub);

  return NextResponse.json({ success: true });
}
