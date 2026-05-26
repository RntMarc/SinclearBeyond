import Parser from "rss-parser";

const parser = new Parser({
  customFields: {
    item: [
      ["media:content", "mediaContent", { keepArray: true }],
      ["media:thumbnail", "mediaThumbnail"],
      ["content:encoded", "contentEncoded"],
      ["enclosure", "enclosure"],
    ],
  },
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

export async function fetchRssFeed(url) {
  const now = Date.now();

  // Reset cache if expired
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
    const feed = await parser.parseURL(url);
    const sourceIcon =
      feed.image?.url ||
      `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=64`;

    const items = feed.items.map((item) => {
      // Try to find a preview image
      let previewImage = null;

      // 1. Media content
      if (item.mediaContent && item.mediaContent.length > 0) {
        const img = item.mediaContent.find(
          (m) => m.$?.medium === "image" || m.$?.type?.startsWith("image/"),
        );
        if (img) previewImage = img.$.url;
      }

      // 2. Media thumbnail
      if (!previewImage && item.mediaThumbnail) {
        previewImage = item.mediaThumbnail.$.url;
      }

      // 3. Enclosure
      if (
        !previewImage &&
        item.enclosure &&
        item.enclosure.type?.startsWith("image/")
      ) {
        previewImage = item.enclosure.url;
      }

      // 4. Extract from content (rough regex)
      if (!previewImage && (item.contentEncoded || item.content)) {
        const content = item.contentEncoded || item.content;
        const imgMatch = content.match(/<img[^>]+src="([^">]+)"/);
        if (imgMatch) previewImage = imgMatch[1];
      }

      return {
        id: item.guid || item.link,
        title: item.title,
        link: item.link,
        pubDate: item.pubDate,
        content: item.contentSnippet || item.content,
        previewImage,
        sourceName: feed.title,
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
