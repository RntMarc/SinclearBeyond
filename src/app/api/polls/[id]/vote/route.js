import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { phpFetch } from "@/lib/api/phpClient";

export async function POST(request, { params }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { answers } = await request.json();

    if (!answers || !Array.isArray(answers)) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const result = await phpFetch(`/polls/${id}/vote`, {
      method: "POST",
      body: { answers },
    });

    if (!result.ok) {
      if (result.status === 404) {
        return NextResponse.json({ error: "Poll not found" }, { status: 404 });
      }
      if (result.status === 403) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to vote:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
