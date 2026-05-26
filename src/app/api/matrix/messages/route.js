import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getMatrixSession } from "@/lib/matrix/session";

async function matrixFetch(matrix, path, options = {}) {
  return fetch(`${matrix.homeserver}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${matrix.accessToken}`,
      ...(options.headers || {}),
    },
  });
}

export async function GET(request) {
  const session = await getSession();
  if (!session?.sub)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const matrix = await getMatrixSession();
  if (!matrix?.accessToken)
    return NextResponse.json(
      { error: "Matrix session required" },
      { status: 401 },
    );

  const { searchParams } = new URL(request.url);
  const roomId = searchParams.get("roomId");
  if (!roomId)
    return NextResponse.json({ error: "Missing roomId" }, { status: 400 });

  const res = await matrixFetch(
    matrix,
    `/_matrix/client/v3/rooms/${encodeURIComponent(roomId)}/messages?dir=b&limit=50`,
  );
  const data = await res.json();
  if (!res.ok)
    return NextResponse.json(
      { error: "Fetch messages failed" },
      { status: 400 },
    );

  const events = (data.chunk || [])
    .filter((e) => e.type === "m.room.message" && e.content?.body)
    .map((e) => ({
      id: e.event_id,
      sender: e.sender,
      body: e.content.body,
      ts: e.origin_server_ts,
    }));

  return NextResponse.json({ messages: events.reverse() });
}

export async function POST(request) {
  const session = await getSession();
  if (!session?.sub)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const matrix = await getMatrixSession();
  if (!matrix?.accessToken)
    return NextResponse.json(
      { error: "Matrix session required" },
      { status: 401 },
    );

  const body = await request.json().catch(() => null);
  if (!body?.roomId || !body?.message)
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const res = await matrixFetch(
    matrix,
    `/_matrix/client/v3/rooms/${encodeURIComponent(body.roomId)}/send/m.room.message/${crypto.randomUUID()}`,
    {
      method: "PUT",
      body: JSON.stringify({ msgtype: "m.text", body: body.message }),
    },
  );

  if (!res.ok)
    return NextResponse.json({ error: "Send failed" }, { status: 400 });
  return NextResponse.json({ ok: true });
}
