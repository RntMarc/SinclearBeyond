import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { phpFetch } from "@/lib/api/phpClient";

export async function GET(_req, { params }) {
  const { id: forumId } = await params;
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const result = await phpFetch(`/forums/${forumId}/detail`);

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error || "Forum not found" },
        { status: result.status || 500 },
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("[API/Forums/[id]] GET Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
