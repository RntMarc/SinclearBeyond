import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { callInternalV2Endpoint } from "@/lib/auth/internalV2";

export async function POST() {
  const cookieStore = await cookies();
  const flowCookie = cookieStore.get("v2_auth_flow")?.value;

  if (!flowCookie) {
    return NextResponse.json(
      { error: "No pending v2 auth flow" },
      { status: 400 },
    );
  }

  let flow;
  try {
    flow = JSON.parse(flowCookie);
  } catch {
    return NextResponse.json(
      { error: "Invalid v2 auth flow cookie" },
      { status: 400 },
    );
  }

  if (!flow?.redirect_uri || !flow?.code_challenge) {
    return NextResponse.json(
      { error: "Incomplete v2 auth flow data" },
      { status: 400 },
    );
  }

  const { getSession } = await import("@/lib/auth/session");
  const session = await getSession();
  if (!session?.sub) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const result = await callInternalV2Endpoint("/api/internal/issue-code", {
    method: "POST",
    body: {
      user_id: session.sub,
      code_challenge: flow.code_challenge,
      code_challenge_method: "S256",
      redirect_uri: flow.redirect_uri,
    },
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error || "Failed to issue code" },
      { status: 500 },
    );
  }

  cookieStore.delete("v2_auth_flow");

  const sep = flow.redirect_uri.includes("?") ? "&" : "?";
  const params = new URLSearchParams();
  params.set("code", result.data.code);
  if (flow.state) params.set("state", flow.state);
  const target = `${flow.redirect_uri}${sep}${params.toString()}`;

  return NextResponse.json({ redirect: target });
}
