import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import {
  createOAuthTx,
  discoverOAuth,
  normalizeHomeserver,
  registerOAuthClient,
} from "@/lib/matrix/oauth";

export async function GET(request) {
  const session = await getSession();
  if (!session?.sub)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams, origin } = new URL(request.url);
  const homeserver = normalizeHomeserver(searchParams.get("homeserver"));
  const mode = searchParams.get("mode") || "session";
  if (!homeserver || !["session", "link"].includes(mode))
    return NextResponse.json({ error: "Invalid params" }, { status: 400 });

  const cfg = await discoverOAuth(homeserver);
  if (!cfg)
    return NextResponse.json({ error: "OAuth unsupported" }, { status: 400 });

  const redirectUri = `${process.env.NEXT_PUBLIC_ORIGIN || origin}/api/matrix/oauth/callback`;
  const registrationEndpoint = cfg.registration_endpoint;
  if (!registrationEndpoint)
    return NextResponse.json(
      { error: "OAuth registration unsupported" },
      { status: 400 },
    );

  const clientId = await registerOAuthClient({
    registrationEndpoint,
    origin,
    redirectUri,
  });
  if (!clientId)
    return NextResponse.json(
      { error: "OAuth client registration failed" },
      { status: 400 },
    );

  const { state, codeChallenge } = await createOAuthTx({
    homeserver,
    mode,
    clientId,
  });
  const authUrl = new URL(cfg.authorization_endpoint);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set(
    "scope",
    "openid profile offline_access urn:matrix:org.matrix.msc2967.client:api:*",
  );
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("code_challenge", codeChallenge);
  authUrl.searchParams.set("code_challenge_method", "S256");

  return NextResponse.redirect(authUrl.toString());
}
