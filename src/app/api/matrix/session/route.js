import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import {
  clearMatrixSession,
  getMatrixSession,
  setMatrixSession,
} from "@/lib/matrix/session";
import { resolveHomeserver } from "@/lib/matrix/oauth";

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

  const homeserver = await resolveHomeserver(body?.homeserver);
  if (!homeserver)
    return NextResponse.json({ error: "Missing homeserver" }, { status: 400 });

  if (body?.method === "password") {
    const matrixUserIdent = body?.matrixUser?.replace(/^@/, "").split(":")[0];
    const password = body?.password;

    if (!matrixUserIdent || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const loginRes = await fetch(`${homeserver}/_matrix/client/v3/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "m.login.password",
        identifier: { type: "m.id.user", user: matrixUserIdent },
        password: password,
        initial_device_display_name: "Sinclear Beyond Session",
      }),
    });

    const loginData = await loginRes.json().catch(() => null);
    if (!loginRes.ok || !loginData?.access_token || !loginData?.user_id) {
      return NextResponse.json({ error: "Login failed" }, { status: 401 });
    }

    await setMatrixSession({
      accessToken: loginData.access_token,
      matrixUserId: loginData.user_id,
      homeserver: homeserver,
      password: password,
    });

    return NextResponse.json({ authenticated: true });
  }

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
