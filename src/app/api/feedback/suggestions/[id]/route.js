import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/auth";
import { phpFetch } from "@/lib/api/phpClient";

export async function PATCH(req, { params }) {
  const { id } = await params;
  const token = req.cookies.get("session")?.value;
  if (!token)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const payload = await verifyToken(token);
    const userId = payload.sub;

    const userRes = await phpFetch(`/users/${userId}`);
    const user = userRes.ok ? userRes.data : null;

    const body = await req.json();
    const { title, description, status } = body;

    const suggestionRes = await phpFetch(`/feedback-suggestions/${id}`);
    if (!suggestionRes.ok)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    const suggestion = suggestionRes.data;

    // Admin can update status
    if (user?.isAdmin && status && status !== suggestion.status) {
      const updateResult = await phpFetch(`/feedback-suggestions/${id}`, {
        method: "PATCH",
        body: { status, updatedAt: new Date().toISOString() },
      });
      if (!updateResult.ok) throw new Error(updateResult.error);
      return NextResponse.json({ success: true });
    }

    if (suggestion.userId !== userId)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    if (!title)
      return NextResponse.json({ error: "Title is required" }, { status: 400 });

    // Check if there are any upvotes from other users
    const votesRes = await phpFetch(
      `/feedback-votes?suggestionId=${id}&userId[neq]=${userId}`,
    );
    const otherVotes = votesRes.ok ? votesRes.data?.length || 0 : 0;

    if (otherVotes > 0) {
      return NextResponse.json(
        { error: "Cannot edit suggestion with existing upvotes from others" },
        { status: 400 },
      );
    }

    const finalUpdateResult = await phpFetch(`/feedback-suggestions/${id}`, {
      method: "PATCH",
      body: { title, description, updatedAt: new Date().toISOString() },
    });
    if (!finalUpdateResult.ok) throw new Error(finalUpdateResult.error);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error editing suggestion:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(req, { params }) {
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

    if (suggestion.userId !== userId)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Check if there are any upvotes from other users
    const votesRes = await phpFetch(
      `/feedback-votes?suggestionId=${id}&userId[neq]=${userId}`,
    );
    const otherVotes = votesRes.ok ? votesRes.data?.length || 0 : 0;

    if (otherVotes > 0) {
      return NextResponse.json(
        { error: "Cannot delete suggestion with existing upvotes from others" },
        { status: 400 },
      );
    }

    // Delete votes first
    await phpFetch(`/feedback-votes?suggestionId=${id}`, { method: "DELETE" });

    const delResult = await phpFetch(`/feedback-suggestions/${id}`, {
      method: "DELETE",
    });
    if (!delResult.ok) throw new Error(delResult.error);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting suggestion:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
