import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { clearMatrixSession, getMatrixSession } from "@/lib/matrix/session";
import { normalizeHomeserver } from "@/lib/matrix/oauth";

export async function GET() {
  const session = await getSession();
  if (!session?.sub)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const matrix = await getMatrixSession();
  return NextResponse.json({
    authenticated: Boolean(matrix?.accessToken),
    matrixUserId: matrix?.matrixUserId ?? null,
    homeserver: matrix?.homeserver ?? null,
  });
}

export async function POST(request) {
  const session = await getSession();
  if (!session?.sub)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  const homeserver = normalizeHomeserver(body?.homeserver);
  if (!homeserver)
    return NextResponse.json({ error: "Missing homeserver" }, { status: 400 });
  return NextResponse.json({
    redirectTo: `/api/matrix/oauth/start?mode=session&homeserver=${encodeURIComponent(homeserver)}`,
  });
}

export async function DELETE() {
  const session = await getSession();
  if (!session?.sub)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await clearMatrixSession();
  return NextResponse.json({ ok: true });
}
