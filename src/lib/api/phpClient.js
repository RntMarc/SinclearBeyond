import "server-only";
import { cookies } from "next/headers";

const API_BASE_URL =
  process.env.SINCLEAR_PHP_API_URL || "https://api.sinclear.de/api/v1";

/**
 * PHP API Client for Sinclear Beyond
 */
export async function phpFetch(
  path,
  { method = "GET", body, headers = {}, cache = "no-store", next, accessToken: explicitAccessToken } = {},
) {
  const cookieStore = await cookies();
  const accessToken = explicitAccessToken ?? cookieStore.get("accessToken")?.value;

  const defaultHeaders = {
    "Content-Type": "application/json",
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  };

  const url = `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

  if (process.env.NODE_ENV !== "production") {
    console.log(`[PHP API] Request: ${method} ${url}`, {
      hasAuth: !!accessToken,
      authPreview: accessToken ? `${accessToken.substring(0, 20)}...` : "none",
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
        // Make direct call to PHP API /auth/refresh to get new token
        const refreshUrl = `${API_BASE_URL}/auth/refresh`;
        const refreshResponse = await fetch(refreshUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          console.log(`[PHP API] Token refresh successful, retrying ${url} with new token`);
          // Retry original request with the new token
          return phpFetch(path, { method, body, headers, cache, next, accessToken: refreshData.accessToken });
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

    if (process.env.NODE_ENV !== "production") {
      console.log(`[PHP API] Success: ${method} ${url}`);
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
