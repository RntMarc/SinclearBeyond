import { NextResponse } from "next/server";
import { verifyInternalHmac } from "@/lib/auth/internalV2";
import { signApiAccessToken } from "@/lib/auth/v2";

export async function POST(req) {
  const url = new URL(req.url);
  const path = url.pathname;
  const rawBody = await req.text();
  const headers = Object.fromEntries(req.headers);

  if (!verifyInternalHmac({ method: "POST", path, body: rawBody, headers })) {
    return NextResponse.json(
      { error: "Invalid or missing internal HMAC signature" },
      { status: 401 },
    );
  }

  let body;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const userId = body?.user_id;
  if (!userId) {
    return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
  }

  try {
    const token = await signApiAccessToken({ userId, tokenVersion: 1 });
    return NextResponse.json({ token });
  } catch (error) {
    return NextResponse.json(
      { error: error?.message || "Failed to sign token" },
      { status: 500 },
    );
  }
}
