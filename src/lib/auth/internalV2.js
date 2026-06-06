import "server-only";
import { createHmac } from "node:crypto";

function getInternalConfig() {
  const baseUrl = process.env.SINCLEAR_CHAT_API_URL?.replace(/\/$/, "");
  const secret = process.env.AUTH_INTERNAL_SECRET;

  if (!baseUrl || !secret) {
    return {
      error:
        "Internal v2 auth not configured. Set SINCLEAR_CHAT_API_URL and AUTH_INTERNAL_SECRET.",
    };
  }

  return { baseUrl, secret };
}

function createSignature({ secret, timestamp, method, path, body }) {
  const payload = `${timestamp}.${method.toUpperCase()}.${path}.${body}`;
  return createHmac("sha256", secret).update(payload).digest("hex");
}

function normalizeBody(body) {
  if (body === undefined || body === null) return "";
  if (typeof body === "string") return body;
  return JSON.stringify(body);
}

export async function callInternalV2Endpoint(
  path,
  { method = "POST", body, timeoutMs = 5000 } = {},
) {
  const config = getInternalConfig();
  if (config.error) {
    return { ok: false, status: 503, data: null, error: config.error };
  }

  const normalizedMethod = method.toUpperCase();
  const requestBody = normalizeBody(body);
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = createSignature({
    secret: config.secret,
    timestamp,
    method: normalizedMethod,
    path,
    body: requestBody,
  });

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(`${config.baseUrl}${path}`, {
      method: normalizedMethod,
      headers: {
        "Content-Type": "application/json",
        "X-Hub-Timestamp": timestamp,
        "X-Hub-Signature": signature,
      },
      body: requestBody || undefined,
      signal: controller.signal,
      cache: "no-store",
    });

    clearTimeout(timeout);

    let data = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        data,
        error: data?.error || response.statusText || "Internal v2 call failed",
      };
    }

    return { ok: true, status: response.status, data, error: null };
  } catch (error) {
    return {
      ok: false,
      status: 502,
      data: null,
      error: error?.message || "Internal v2 call failed",
    };
  }
}

export function verifyInternalHmac({ method, path, body, headers }) {
  const config = getInternalConfig();
  if (config.error) {
    return false;
  }

  const timestamp = headers["x-hub-timestamp"] || headers["X-Hub-Timestamp"];
  const signature = headers["x-hub-signature"] || headers["X-Hub-Signature"];

  if (!timestamp || !signature) {
    return false;
  }
  if (!/^\d+$/.test(timestamp)) {
    return false;
  }
  const ts = Number.parseInt(timestamp, 10);
  if (Math.abs(Math.floor(Date.now() / 1000) - ts) > 300) {
    return false;
  }

  const bodyStr = typeof body === "string" ? body : body || "";
  const expected = createSignature({
    secret: config.secret,
    timestamp,
    method,
    path,
    body: bodyStr,
  });

  return expected === signature;
}
