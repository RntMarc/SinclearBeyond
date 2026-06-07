import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { callInternalV2Endpoint } from "@/lib/auth/internalV2";
import { getOrigin } from "@/lib/auth/origin";
import { getSession } from "@/lib/auth/session";

function isAllowedRedirectUri(uri) {
  if (typeof uri !== "string" || uri === "") return false;
  if (uri.startsWith("https://") || uri.startsWith("http://")) {
    try {
      const u = new URL(uri);
      const base = new URL(getOrigin());
      return u.host === base.host;
    } catch {
      return false;
    }
  }
  if (uri.startsWith("sinclearchat://")) return true;
  return false;
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const redirectUri = searchParams.get("redirect_uri") || "";
  const state = searchParams.get("state") || "";
  const codeChallenge = searchParams.get("code_challenge") || "";
  const codeChallengeMethod = searchParams.get("code_challenge_method") || "";

  if (!isAllowedRedirectUri(redirectUri)) {
    return NextResponse.json(
      { error: "Invalid or missing redirect_uri" },
      { status: 400 },
    );
  }
  if (!codeChallenge || codeChallengeMethod !== "S256") {
    return NextResponse.json(
      { error: "PKCE code_challenge is required (S256)" },
      { status: 400 },
    );
  }
  if (!/^[A-Za-z0-9_-]{43,128}$/.test(codeChallenge)) {
    return NextResponse.json(
      { error: "Invalid code_challenge format" },
      { status: 400 },
    );
  }

  const session = await getSession();
  const cookieStore = await cookies();

  if (!session) {
    cookieStore.set(
      "v2_auth_flow",
      JSON.stringify({
        redirect_uri: redirectUri,
        state,
        code_challenge: codeChallenge,
        code_challenge_method: "S256",
        created_at: Date.now(),
      }),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 600,
      },
    );

    const loginUrl = new URL("/login", getOrigin());
    loginUrl.searchParams.set("v2_flow", "1");
    return NextResponse.redirect(loginUrl);
  }

  const result = await callInternalV2Endpoint("/api/internal/issue-code", {
    method: "POST",
    body: {
      user_id: session.sub,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      redirect_uri: redirectUri,
    },
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error || "Failed to issue code" },
      { status: 500 },
    );
  }

  return redirectToApp(redirectUri, result.data.code, state);
}

function redirectToApp(redirectUri, code, state) {
  const sep = redirectUri.includes("?") ? "&" : "?";
  const params = new URLSearchParams();
  params.set("code", code);
  if (state) params.set("state", state);
  const target = `${redirectUri}${sep}${params.toString()}`;
  return NextResponse.redirect(target);
}

export async function POST() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
