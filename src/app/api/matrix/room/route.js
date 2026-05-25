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

export async function POST(request) {
  const session = await getSession();
  if (!session?.sub) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const matrix = await getMatrixSession();
  if (!matrix?.accessToken) return NextResponse.json({ error: "Matrix session required" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const targetMatrixUserId = body?.targetMatrixUserId?.toString();
  if (!targetMatrixUserId) return NextResponse.json({ error: "Missing target" }, { status: 400 });

  const createRoomRes = await matrixFetch(matrix, "/_matrix/client/v3/createRoom", {
    method: "POST",
    body: JSON.stringify({ is_direct: true, invite: [targetMatrixUserId], preset: "trusted_private_chat" }),
  });
  const roomData = await createRoomRes.json();
  if (!createRoomRes.ok || !roomData.room_id) return NextResponse.json({ error: "Create room failed" }, { status: 400 });

  return NextResponse.json({ roomId: roomData.room_id });
}
