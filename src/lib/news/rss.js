import { XMLParser } from "fast-xml-parser";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
});

// In-memory cache
const rssCache = {
  data: {}, // { url: { items, sourceIcon, expiresAt } }
  expiresAt: null,
};

function getNextHour() {
  const now = new Date();
  const nextHour = new Date(now);
  nextHour.setHours(now.getHours() + 1, 0, 0, 0);
  return nextHour.getTime();
}

function extractImage(item) {
  // 1. media:content
  const mediaContent = item["media:content"];
  if (mediaContent) {
    if (Array.isArray(mediaContent)) {
      const img = mediaContent.find(m => m["@_medium"] === "image" || m["@_type"]?.startsWith("image/"));
      if (img) return img["@_url"];
    } else if (mediaContent["@_medium"] === "image" || mediaContent["@_type"]?.startsWith("image/")) {
      return mediaContent["@_url"];
    }
  }

  // 2. enclosure
  const enclosure = item.enclosure;
  if (enclosure) {
    if (Array.isArray(enclosure)) {
      const img = enclosure.find(e => e["@_type"]?.startsWith("image/"));
      if (img) return img["@_url"];
    } else if (enclosure["@_type"]?.startsWith("image/")) {
      return enclosure["@_url"];
    }
  }

  // 3. content:encoded or description
  const content = item["content:encoded"] || item.description || "";
  const imgMatch = content.toString().match(/<img[^>]+src="([^">]+)"/);
  if (imgMatch) return imgMatch[1];

  return null;
}

export async function fetchRssFeed(url) {
  const now = Date.now();

  if (rssCache.expiresAt && now >= rssCache.expiresAt) {
    rssCache.data = {};
    rssCache.expiresAt = getNextHour();
  }

  if (!rssCache.expiresAt) {
    rssCache.expiresAt = getNextHour();
  }

  if (rssCache.data[url]) {
    return rssCache.data[url];
  }

  try {
    const response = await fetch(url);
    const xmlData = await response.text();
    const jsonObj = parser.parse(xmlData);

    const channel = jsonObj.rss?.channel || jsonObj.feed;
    if (!channel) return { items: [], sourceIcon: null };

    const sourceIcon = channel.image?.url || `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=64`;

    const rawItems = channel.item || channel.entry || [];
    const itemsList = Array.isArray(rawItems) ? rawItems : [rawItems];

    const items = itemsList.map((item) => {
      const link = item.link?.["@_href"] || item.link || "";
      return {
        id: item.guid?.["#text"] || item.guid || item.id || link,
        title: item.title?.["#text"] || item.title || "No Title",
        link,
        pubDate: item.pubDate || item.published || item.updated,
        content: item.description || item.summary?.["#text"] || item.summary || "",
        previewImage: extractImage(item),
        sourceName: channel.title?.["#text"] || channel.title || "RSS Feed",
        sourceIcon,
      };
    });

    const result = { items, sourceIcon };
    rssCache.data[url] = result;
    return result;
  } catch (error) {
    console.error(`Error fetching RSS feed from ${url}:`, error);
    return { items: [], sourceIcon: null };
  }
}
