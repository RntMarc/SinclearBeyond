import "server-only";
import { cookies } from "next/headers";

const API_BASE_URL =
  process.env.SINCLEAR_PHP_API_URL || "https://api.sinclear.de/api/v1";

/**
 * PHP API Client for Sinclear Beyond
 */
export async function phpFetch(
  path,
  { method = "GET", body, headers = {}, cache = "no-store", next } = {},
) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  const defaultHeaders = {
    "Content-Type": "application/json",
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  };

  const url = `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

  if (process.env.NODE_ENV !== "production") {
    console.log(`[PHP API] Request: ${method} ${url}`, {
      headers: { ...defaultHeaders, ...headers },
      body,
    });
  }

  try {
    const response = await fetch(url, {
      method,
      headers: {
        ...defaultHeaders,
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      cache,
      next,
    });

    // Handle token refresh if 401
    if (response.status === 401 && !path.includes("/auth/refresh")) {
      console.warn(
        `[PHP API] 401 Unauthorized for ${url}, attempting refresh...`,
      );
      const refreshToken = cookieStore.get("refreshToken")?.value;
      if (refreshToken) {
        const refreshed = await refreshTokens(refreshToken);
        if (refreshed.ok) {
          console.log(`[PHP API] Token refresh successful, retrying ${url}`);
          // Retry original request with new token
          return phpFetch(path, { method, body, headers, cache, next });
        } else {
          console.error(`[PHP API] Token refresh failed for ${url}`);
        }
      } else {
        console.warn(`[PHP API] No refresh token available for ${url}`);
      }
    }

    if (response.status === 204) {
      return { ok: true, status: 204, data: null };
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      console.error(`[PHP API] Error Response: ${response.status} ${url}`, {
        error: data?.error || response.statusText,
        data,
      });
      return {
        ok: false,
        status: response.status,
        error: data?.error || response.statusText || "Request failed",
        data,
      };
    }

    return { ok: true, status: response.status, data };
  } catch (error) {
    console.error(`[PHP API] Fetch Exception: ${method} ${url}`, error);
    return {
      ok: false,
      status: 500,
      error: error.message || "Internal Server Error",
    };
  }
}

async function refreshTokens(refreshToken) {
  const url = `${API_BASE_URL}/auth/refresh`;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      return { ok: false };
    }

    const data = await response.json();
    const cookieStore = await cookies();

    cookieStore.set("accessToken", data.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: data.expiresIn || 900,
      path: "/",
    });

    if (data.refreshToken) {
      cookieStore.set("refreshToken", data.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/",
      });
    }

    return { ok: true };
  } catch (error) {
    console.error("[PHP API] Token refresh failed:", error);
    return { ok: false };
  }
}
