import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth/session";

const cache = new Map();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

export async function GET(req) {
  const t = await getTranslations("Common");
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: t("unauthorized") }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const urlString = searchParams.get("url");

  if (!urlString) {
    return NextResponse.json({ error: t("missingFields") }, { status: 400 });
  }

  let url;
  try {
    url = new URL(urlString);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return NextResponse.json({ error: "Forbidden protocol" }, { status: 403 });
  }

  const hostname = url.hostname.toLowerCase();

  // Robust SSRF Check
  const isPrivate =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "[::1]" ||
    hostname === "169.254.169.254" ||
    hostname.startsWith("10.") ||
    hostname.startsWith("192.168.") ||
    /^(172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(hostname) || // 172.16.0.0 - 172.31.255.255
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal");

  if (isPrivate) {
    return NextResponse.json(
      { error: "Internal URLs are forbidden" },
      { status: 403 },
    );
  }

  const now = Date.now();
  const cached = cache.get(urlString);
  if (cached && now - cached.timestamp < CACHE_TTL) {
    return NextResponse.json(cached.data);
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(urlString, {
      headers: {
        "User-Agent": "Mozilla/5.0 (SinclearBeyond/1.0; +https://sinclear.de)",
        Accept: "text/html",
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch URL" },
        { status: 400 },
      );
    }

    // Efficient Buffer Handling
    const MAX_SIZE = 512 * 1024; // 512KB
    const reader = response.body.getReader();
    let receivedLength = 0;
    const chunks = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      receivedLength += value.length;
      if (receivedLength > MAX_SIZE) {
        reader.cancel();
        break;
      }
    }

    const combined = new Uint8Array(receivedLength);
    let offset = 0;
    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }

    const html = new TextDecoder().decode(combined);

    // Metadata Extraction
    const ogImageMatch =
      html.match(
        /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i,
      ) ||
      html.match(
        /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i,
      );

    const twitterImageMatch =
      html.match(
        /<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i,
      ) ||
      html.match(
        /<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i,
      );

    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    const ogTitleMatch = html.match(
      /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i,
    );

    let image = ogImageMatch?.[1] || twitterImageMatch?.[1] || null;

    // Resolve relative URLs
    if (image && !image.startsWith("http")) {
      try {
        image = new URL(image, urlString).toString();
      } catch {
        image = null;
      }
    }

    const data = {
      image,
      title: ogTitleMatch?.[1] || titleMatch?.[1] || null,
    };

    cache.set(urlString, { data, timestamp: now });

    return NextResponse.json(data);
  } catch (error) {
    if (error.name === "AbortError") {
      return NextResponse.json({ error: "Request timeout" }, { status: 408 });
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
