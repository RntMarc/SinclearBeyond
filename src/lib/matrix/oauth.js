import crypto from "node:crypto";
import { cookies } from "next/headers";

const OAUTH_COOKIE = "matrix_oauth_tx";

function b64url(buf) {
  return buf.toString("base64url");
}

export function normalizeHomeserver(input) {
  const value = (input || "").trim();
  if (!value) return null;
  if (value.startsWith("http://") || value.startsWith("https://")) return value.replace(/\/$/, "");
  return `https://${value.replace(/\/$/, "")}`;
}

export async function createOAuthTx({ homeserver, mode }) {
  const state = b64url(crypto.randomBytes(24));
  const codeVerifier = b64url(crypto.randomBytes(48));
  const codeChallenge = b64url(crypto.createHash("sha256").update(codeVerifier).digest());
  const jar = await cookies();
  jar.set(OAUTH_COOKIE, JSON.stringify({ state, codeVerifier, homeserver, mode }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  return { state, codeChallenge };
}

export async function readOAuthTx() {
  const jar = await cookies();
  const raw = jar.get(OAUTH_COOKIE)?.value;
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export async function clearOAuthTx() {
  const jar = await cookies();
  jar.delete(OAUTH_COOKIE);
}

export async function discoverOAuth(homeserver) {
  const base = homeserver.replace(/\/$/, "");

  const authMetadata = await fetch(`${base}/_matrix/client/v1/auth_metadata`)
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null);

  if (authMetadata?.authorization_endpoint && authMetadata?.token_endpoint) {
    return authMetadata;
  }

  const wellKnownOAuth = await fetch(`${base}/.well-known/oauth-authorization-server`)
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null);

  if (wellKnownOAuth?.authorization_endpoint && wellKnownOAuth?.token_endpoint) {
    return wellKnownOAuth;
  }

  const oidc = await fetch(`${base}/.well-known/openid-configuration`)
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null);

  if (oidc?.authorization_endpoint && oidc?.token_endpoint) {
    return oidc;
  }

  return null;
}
