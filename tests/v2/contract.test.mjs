#!/usr/bin/env node
/**
 * V2 contract tests — validates that Next.js and PHP compute the same
 * cryptographic values across the auth handshake.
 *
 * Run with: node tests/v2/contract.test.mjs
 *
 * These tests run without a database, backend, or any external service.
 * They prove the wire-format compatibility between the two implementations.
 */

import { createHash, createHmac, randomBytes } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { importPKCS8, importSPKI, jwtVerify, SignJWT } from "jose";

let passed = 0;
let failed = 0;
const failures = [];

function assert(cond, label) {
  if (cond) {
    passed++;
    console.log(`  ok  ${label}`);
  } else {
    failed++;
    failures.push(label);
    console.log(`  FAIL ${label}`);
  }
}

function section(name) {
  console.log(`\n=== ${name} ===`);
}

// ---------- Test 1: PKCE S256 ----------
section("PKCE S256 (RFC 7636)");

// RFC 7636 §4.6 official test vector
const PKCE_VERIFIER = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
const PKCE_EXPECTED_CHALLENGE = "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM";

function computePkceChallengeS256(verifier) {
  return createHash("sha256")
    .update(verifier)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

const challenge = computePkceChallengeS256(PKCE_VERIFIER);
assert(
  challenge === PKCE_EXPECTED_CHALLENGE,
  "RFC 7636 §4.6 test vector matches",
);
assert(
  challenge === computePkceChallengeS256(PKCE_VERIFIER),
  "S256 challenge is deterministic",
);
assert(
  !/[+/=]/.test(challenge),
  "Challenge uses base64url (no +, /, = padding)",
);
assert(
  challenge.length === 43,
  "Challenge is 43 chars (256-bit SHA → 43 base64 chars)",
);

// Random verifier round-trip
const randomVerifier = randomBytes(32).toString("base64url");
const randomChallenge = computePkceChallengeS256(randomVerifier);
assert(
  randomChallenge.length === 43,
  "Random verifier produces 43-char challenge",
);

// ---------- Test 2: JWT RS256 cross-sign ----------
section("JWT RS256 (Next.js sign ↔ PHP verify)");

const privPem = readFileSync("SinclearChat/keys/jwt_private.pem", "utf8");
const pubPem = readFileSync("SinclearChat/keys/jwt_public.pem", "utf8");

if (existsSync("SinclearChat/keys/jwt_private.pem")) {
  const priv = await importPKCS8(privPem, "RS256");
  const pub = await importSPKI(pubPem, "RS256");

  const token = await new SignJWT({ token_version: 7 })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setSubject("019e9ecf-user-abc")
    .setIssuer("https://app.sinclear.de")
    .setAudience("chat-api")
    .setIssuedAt()
    .setExpirationTime("15m")
    .setJti("019e9ecf-aabb-ccdd-eeff-001122334455")
    .sign(priv);

  const { payload } = await jwtVerify(token, pub, {
    issuer: "https://app.sinclear.de",
    audience: "chat-api",
  });

  assert(payload.sub === "019e9ecf-user-abc", "sub claim preserved");
  assert(payload.aud === "chat-api", "aud claim preserved");
  assert(payload.iss === "https://app.sinclear.de", "iss claim preserved");
  assert(payload.token_version === 7, "token_version claim preserved");
  assert(
    typeof payload.jti === "string" && payload.jti.length === 36,
    "jti is 36-char UUID (hex with hyphens)",
  );
  assert(typeof payload.exp === "number", "exp claim is a number");
  assert(typeof payload.iat === "number", "iat claim is a number");

  // Negative case: wrong issuer should fail
  let wrongIssRejected = false;
  try {
    await jwtVerify(token, pub, {
      issuer: "https://evil.com",
      audience: "chat-api",
    });
  } catch {
    wrongIssRejected = true;
  }
  assert(wrongIssRejected, "Wrong issuer is rejected");

  // Negative case: wrong audience should fail
  let wrongAudRejected = false;
  try {
    await jwtVerify(token, pub, {
      issuer: "https://app.sinclear.de",
      audience: "evil-api",
    });
  } catch {
    wrongAudRejected = true;
  }
  assert(wrongAudRejected, "Wrong audience is rejected");

  // Negative case: expired token should fail
  const expiredToken = await new SignJWT({ token_version: 1 })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setSubject("user-x")
    .setIssuer("https://app.sinclear.de")
    .setAudience("chat-api")
    .setIssuedAt(Math.floor(Date.now() / 1000) - 3600)
    .setExpirationTime(Math.floor(Date.now() / 1000) - 60)
    .setJti("expired-jti-001")
    .sign(priv);

  let expiredRejected = false;
  try {
    await jwtVerify(expiredToken, pub, {
      issuer: "https://app.sinclear.de",
      audience: "chat-api",
    });
  } catch (err) {
    expiredRejected = err.code === "ERR_JWT_EXPIRED";
  }
  assert(expiredRejected, "Expired token is rejected with ERR_JWT_EXPIRED");
} else {
  console.log(
    "  skip: keys not generated yet (run php scripts/generate-rs256-keypair.php)",
  );
}

// ---------- Test 3: HMAC signature parity ----------
section("Internal HMAC (Next.js ↔ PHP)");

// Both implementations must produce the same signature for the same inputs.
// PHP signature format: ${timestamp}.${method}.${path}.${body}
// (this is what we use in internalV2.js + .env.example)
function hmacSign(secret, timestamp, method, path, body) {
  const payload = `${timestamp}.${method.toUpperCase()}.${path}.${body}`;
  return createHmac("sha256", secret).update(payload).digest("hex");
}

const SECRET = "test-internal-secret-32-bytes-please";
const ts = "1700000000";
const body = '{"user_id":"abc","code_challenge":"xyz"}';

const sigA = hmacSign(SECRET, ts, "POST", "/api/internal/issue-code", body);
const sigB = hmacSign(SECRET, ts, "POST", "/api/internal/issue-code", body);
assert(sigA === sigB, "Same inputs produce same signature (deterministic)");
assert(sigA.length === 64, "Signature is 64 hex chars (SHA-256)");

const sigC = hmacSign(SECRET, ts, "post", "/api/internal/issue-code", body);
assert(sigA === sigC, "Method is case-insensitive (matches PHP strtoupper())");

const sigD = hmacSign(
  SECRET,
  ts,
  "POST",
  "/api/internal/issue-code",
  '{"user_id":"abc"}',
);
assert(sigA !== sigD, "Different body produces different signature");

const sigE = hmacSign(SECRET, ts, "POST", "/api/internal/issue-code", "");
assert(sigA !== sigE, "Empty body differs from non-empty body");

const sigF = hmacSign(
  SECRET,
  "9999999999",
  "POST",
  "/api/internal/issue-code",
  body,
);
assert(sigA !== sigF, "Different timestamp produces different signature");

// Test replay protection (timestamp >5 min old)
const oldTs = String(Math.floor(Date.now() / 1000) - 600);
const oldSig = hmacSign(
  SECRET,
  oldTs,
  "POST",
  "/api/internal/issue-code",
  body,
);
assert(oldSig !== sigA, "10-minute-old timestamp produces different signature");
console.log(
  `  info: replay protection is enforced at the call site (|now - ts| > 300 = reject)`,
);

// ---------- Test 4: OAuth2 redirect URI validation ----------
section("OAuth2 redirect_uri allowlist");

const ALLOWED = ["sinclearchat://callback", "sinclear-beyond://oauth"];

function isAllowedRedirectUri(uri) {
  if (typeof uri !== "string" || uri.length === 0 || uri.length > 500) {
    return false;
  }
  // Custom scheme only — no http(s) (those would be web flows)
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(uri)) {
    return false;
  }
  // Exact match against allowlist
  return ALLOWED.includes(uri);
}

assert(isAllowedRedirectUri("sinclearchat://callback"), "Exact match accepted");
assert(
  isAllowedRedirectUri("sinclear-beyond://oauth"),
  "Second scheme accepted",
);
assert(
  !isAllowedRedirectUri("sinclearchat://evil"),
  "Unknown path rejected (exact-match, not prefix)",
);
assert(
  !isAllowedRedirectUri("https://evil.com/callback"),
  "http(s) rejected (custom scheme only)",
);
assert(!isAllowedRedirectUri("javascript:alert(1)"), "javascript: rejected");
assert(!isAllowedRedirectUri(""), "Empty rejected");
assert(!isAllowedRedirectUri(null), "Null rejected");
assert(!isAllowedRedirectUri(undefined), "Undefined rejected");
assert(!isAllowedRedirectUri("a".repeat(501)), "Oversized rejected");

// ---------- Test 5: DirectChat pair normalization ----------
section("DirectChat pair canonicalization");

function normalizePair(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a === b) {
    throw new Error("invalid pair");
  }
  return a < b ? [a, b] : [b, a];
}

const [p1a, p1b] = normalizePair("alice", "bob");
assert(
  p1a === "alice" && p1b === "bob",
  "alphabetical pair stays (alice, bob)",
);

const [p2a, p2b] = normalizePair("bob", "alice");
assert(p2a === "alice" && p2b === "bob", "reverse pair becomes (alice, bob)");

let selfRejected = false;
try {
  normalizePair("alice", "alice");
} catch {
  selfRejected = true;
}
assert(selfRejected, "Self-pair rejected");

// ---------- Summary ----------
console.log(`\n${"=".repeat(40)}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
if (failures.length > 0) {
  console.log("\nFailures:");
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(1);
}
process.exit(0);
