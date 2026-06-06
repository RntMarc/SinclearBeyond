import "server-only";
import { cookies } from "next/headers";
import { callInternalV2Endpoint } from "@/lib/auth/internalV2";

/**
 * Called by login success handlers (OTP verify, Passkey verify, Discord callback).
 * If a `v2_auth_flow` cookie is present, issues an auth code and returns the
 * redirect target for the native client. Otherwise returns null.
 */
export async function completeV2AuthFlowIfPresent() {
  const cookieStore = await cookies();
  const flowCookie = cookieStore.get("v2_auth_flow")?.value;

  if (!flowCookie) {
    return null;
  }

  let flow;
  try {
    flow = JSON.parse(flowCookie);
  } catch {
    return null;
  }

  if (!flow?.redirect_uri || !flow?.code_challenge) {
    return null;
  }

  const { getSession } = await import("@/lib/auth/session");
  const session = await getSession();
  if (!session?.sub) {
    return null;
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
    return { error: result.error || "Failed to issue code" };
  }

  cookieStore.delete("v2_auth_flow");

  const sep = flow.redirect_uri.includes("?") ? "&" : "?";
  const params = new URLSearchParams();
  params.set("code", result.data.code);
  if (flow.state) params.set("state", flow.state);
  const target = `${flow.redirect_uri}${sep}${params.toString()}`;

  return { redirect: target };
}
