import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/auth";
import { phpFetch } from "@/lib/api/phpClient";

export async function POST(req, { params }) {
  const { id } = await params;
  const token = req.cookies.get("session")?.value;
  if (!token)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const payload = await verifyToken(token);
    const userId = payload.sub;

    const suggestionRes = await phpFetch(`/feedback-suggestions/${id}`);
    if (!suggestionRes.ok)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    const suggestion = suggestionRes.data;

    // Voting frozen for done, cancelled, rejected
    if (["done", "cancelled", "rejected"].includes(suggestion.status)) {
      return NextResponse.json(
        { error: "Voting is frozen for this suggestion" },
        { status: 400 },
      );
    }

    // Check if already upvoted
    const votesRes = await phpFetch(
      `/feedback-votes?suggestionId=${id}&userId=${userId}&limit=1`,
    );
    const existingVote = votesRes.ok && votesRes.data?.[0] ? votesRes.data[0] : null;

    if (existingVote) {
      const delResult = await phpFetch(`/feedback-votes/${existingVote.id}`, {
        method: "DELETE",
      });
      if (!delResult.ok) throw new Error(delResult.error);
      return NextResponse.json({ status: "removed" });
    }

    // Add vote
    const createResult = await phpFetch("/feedback-votes", {
      method: "POST",
      body: { suggestionId: id, userId },
    });
    if (!createResult.ok) throw new Error(createResult.error);

    return NextResponse.json({ status: "added" });
  } catch (error) {
    console.error("Error toggling vote:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
