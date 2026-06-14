import crypto from "node:crypto";

const BASE_URL =
  process.env.SINCLEAR_PHP_API_URL || "https://api.sinclear.de/api/v1";
const SECRET = process.env.AUTH_INTERNAL_SECRET || "";

function signRequest(timestamp) {
  if (!SECRET) {
    throw new Error("AUTH_INTERNAL_SECRET is not configured");
  }
  return crypto
    .createHmac("sha256", SECRET)
    .update(String(timestamp))
    .digest("hex");
}

export async function internalFetch(path, options = {}) {
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = signRequest(timestamp);

  const url = `${BASE_URL}${path}`;
  const body = options.body ? JSON.stringify(options.body) : undefined;

  const response = await fetch(url, {
    ...options,
    body,
    headers: {
      "Content-Type": "application/json",
      "X-Timestamp": String(timestamp),
      "X-Signature": signature,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    console.error(`[Internal API] Error: ${response.status} ${path}`, {
      error: data?.error || response.statusText,
    });
    return { ok: false, status: response.status, error: data?.error || response.statusText, data };
  }

  const data = await response.json().catch(() => null);
  return { ok: true, status: response.status, data };
}
