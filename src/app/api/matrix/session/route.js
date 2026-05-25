import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { clearMatrixSession, getMatrixSession, setMatrixSession } from "@/lib/matrix/session";

function normalizeHomeserver(input) {
  const value = (input || "").trim();
  if (!value) return null;
  if (value.startsWith("http://") || value.startsWith("https://")) return value.replace(/\/$/, "");
  return `https://${value.replace(/\/$/, "")}`;
}

export async function GET() {
  const session = await getSession();
  if (!session?.sub) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const matrix = await getMatrixSession();
  return NextResponse.json({ authenticated: Boolean(matrix?.accessToken), matrixUserId: matrix?.matrixUserId ?? null });
}

export async function POST(request) {
  const session = await getSession();
  if (!session?.sub) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const homeserver = normalizeHomeserver(body?.homeserver);
  const identifier = body?.identifier?.toString().trim();
  const password = body?.password?.toString();
  if (!homeserver || !identifier || !password) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const localpart = identifier.replace(/^@/, "").split(":")[0];
  const loginResponse = await fetch(`${homeserver}/_matrix/client/v3/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "m.login.password", identifier: { type: "m.id.user", user: localpart }, password, initial_device_display_name: "Sinclear Beyond" }),
  }).catch(() => null);

  if (!loginResponse?.ok) return NextResponse.json({ error: "Matrix login failed" }, { status: 400 });
  const loginData = await loginResponse.json();

  await setMatrixSession({
    accessToken: loginData.access_token,
    matrixUserId: loginData.user_id,
    homeserver,
    deviceId: loginData.device_id,
  });

  return NextResponse.json({ ok: true, matrixUserId: loginData.user_id });
}

export async function DELETE() {
  const session = await getSession();
  if (!session?.sub) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await clearMatrixSession();
  return NextResponse.json({ ok: true });
}
