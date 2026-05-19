import { useEffect, useState } from "react";

export function useFeedPreview(post) {
  const [preview, setPreview] = useState({ image: null, loading: false });

  // Compute target URL based on post category
  let targetUrl = "";
  if (post.category === "music") {
    targetUrl =
      post.spotifyUrl ||
      post.youtubeMusicUrl ||
      post.youtubeUrl ||
      post.soundcloudUrl;
  } else if (post.category === "video") {
    targetUrl = post.videoUrl;
  } else if (post.category === "news") {
    targetUrl = post.newsUrl;
  } else if (post.category === "other") {
    targetUrl = post.otherUrl;
  }

  useEffect(() => {
    if (!targetUrl) {
      setPreview({ image: null, loading: false });
      return;
    }

    // Direct platform optimizations

    // YouTube
    const ytMatch = targetUrl.match(
      /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|music\.youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    );
    if (ytMatch?.[1]) {
      setPreview({
        image: `https://img.youtube.com/vi/${ytMatch[1]}/mqdefault.jpg`,
        loading: false,
      });
      return;
    }

    // General fallback to our metadata proxy
    setPreview({ image: null, loading: true });

    const controller = new AbortController();

    fetch(`/api/feed/metadata?url=${encodeURIComponent(targetUrl)}`, {
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.image) {
          setPreview({ image: data.image, loading: false });
        } else {
          setPreview({ image: null, loading: false });
        }
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setPreview({ image: null, loading: false });
        }
      });

    return () => controller.abort();
  }, [targetUrl]); // Only re-run when the resolved target URL changes

  return preview;
}
