import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { normalizeHomeserver } from "@/lib/matrix/oauth";

export async function POST(request) {
  const session = await getSession();
  if (!session?.sub)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  const homeserver = normalizeHomeserver(body?.homeserver);
  if (!homeserver)
    return NextResponse.json({ error: "Missing homeserver" }, { status: 400 });
  return NextResponse.json({
    redirectTo: `/api/matrix/oauth/start?mode=link&homeserver=${encodeURIComponent(homeserver)}`,
  });
}
