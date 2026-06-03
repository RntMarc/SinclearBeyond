import { createHmac } from "node:crypto";

function getChatApiConfig() {
  const baseUrl = process.env.SINCLEAR_CHAT_API_URL?.replace(/\/$/, "");
  const secret = process.env.SINCLEAR_CHAT_API_SECRET;

  if (!baseUrl || !secret) {
    return {
      error:
        "SinclearChat API is not configured. Set SINCLEAR_CHAT_API_URL and SINCLEAR_CHAT_API_SECRET.",
    };
  }

  return { baseUrl, secret };
}

function createSignature({ secret, timestamp, method, uri, body }) {
  const payload = `${timestamp}.${method.toUpperCase()}.${uri}.${body}`;
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export async function chatApiRequest(uri, { method = "GET", body } = {}) {
  const config = getChatApiConfig();
  if (config.error) {
    return { ok: false, status: 503, data: null, error: config.error };
  }

  const normalizedMethod = method.toUpperCase();
  const requestBody = body === undefined ? "" : JSON.stringify(body);
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = createSignature({
    secret: config.secret,
    timestamp,
    method: normalizedMethod,
    uri,
    body: requestBody,
  });

  try {
    const response = await fetch(`${config.baseUrl}${uri}`, {
      method: normalizedMethod,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Hub-Timestamp": timestamp,
        "X-Hub-Signature": signature,
      },
      body: requestBody || undefined,
      cache: "no-store",
    });

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
        error: data?.error || response.statusText || "Chat API request failed.",
      };
    }

    return { ok: true, status: response.status, data, error: null };
  } catch (error) {
    return {
      ok: false,
      status: 502,
      data: null,
      error: error?.message || "Chat API request failed.",
    };
  }
}

export async function listChatRooms() {
  return chatApiRequest("/api/rooms");
}
