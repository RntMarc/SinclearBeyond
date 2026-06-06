import "server-only";
import { importPKCS8, importSPKI, jwtVerify, SignJWT } from "jose";

let cachedPrivateKey = null;
let cachedPublicKey = null;

async function getPrivateKey() {
  if (cachedPrivateKey !== null) {
    return cachedPrivateKey;
  }
  const pem = process.env.JWT_API_PRIVATE_KEY;
  if (!pem) {
    throw new Error("JWT_API_PRIVATE_KEY is not configured");
  }
  cachedPrivateKey = await importPKCS8(pem, "RS256");
  return cachedPrivateKey;
}

export async function getPublicKey() {
  if (cachedPublicKey !== null) {
    return cachedPublicKey;
  }
  const pem = process.env.JWT_API_PUBLIC_KEY;
  if (!pem) {
    throw new Error("JWT_API_PUBLIC_KEY is not configured");
  }
  cachedPublicKey = await importSPKI(pem, "RS256");
  return cachedPublicKey;
}

function getIssuer() {
  return process.env.JWT_API_ISSUER || "https://app.sinclear.de";
}

function getAudience() {
  return process.env.JWT_API_AUDIENCE || "chat-api";
}

function getAccessTtl() {
  return Number.parseInt(process.env.JWT_API_ACCESS_TTL || "900", 10);
}

export function generateJti() {
  const ts = Date.now();
  const tsHex = ts.toString(16).padStart(12, "0");
  const rand = Array.from({ length: 20 }, () =>
    Math.floor(Math.random() * 256)
      .toString(16)
      .padStart(2, "0"),
  ).join("");
  const bytes = Buffer.from(tsHex + rand, "hex");
  bytes[6] = (bytes[6] & 0x0f) | 0x70;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  return bytes.toString("hex");
}

export async function signApiAccessToken({ userId, tokenVersion = 1 }) {
  if (!userId) {
    throw new Error("userId is required");
  }

  const key = await getPrivateKey();
  const now = Math.floor(Date.now() / 1000);
  const ttl = getAccessTtl();

  return await new SignJWT({
    token_version: tokenVersion,
  })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(getIssuer())
    .setAudience(getAudience())
    .setSubject(userId)
    .setIssuedAt(now)
    .setExpirationTime(now + ttl)
    .setJti(generateJti())
    .sign(key);
}

export async function verifyApiAccessToken(token) {
  const key = await getPublicKey();
  const { payload } = await jwtVerify(token, key, {
    issuer: getIssuer(),
    audience: getAudience(),
  });
  return payload;
}

export function getAccessTtlSeconds() {
  return getAccessTtl();
}
