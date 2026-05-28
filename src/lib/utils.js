import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Validates a URL to ensure it is a relative path to prevent open redirect vulnerabilities.
 * @param {string} url The URL to validate.
 * @returns {string|null} The validated relative URL or null if invalid.
 */
export function validateRelativeCallbackUrl(url) {
  if (!url) return null;
  // Ensure the URL starts with / but not // (which could be protocol-relative)
  if (url.startsWith("/") && !url.startsWith("//")) {
    return url;
  }
  return null;
}

/**
 * Calculates the relative luminance of a color.
 * @param {string} hex Hex color string (e.g. var(--primary))
 * @returns {number} Luminance value between 0 and 1
 */
export function getLuminance(hex) {
  const rgb = hex
    .replace(/^#/, "")
    .match(/.{2}/g)
    .map((x) => parseInt(x, 16) / 255);

  const [r, g, b] = rgb.map((c) => {
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Calculates the contrast ratio between two colors.
 * @param {string} color1 Hex color string
 * @param {string} color2 Hex color string
 * @returns {number} Contrast ratio between 1 and 21
 */
export function getContrastRatio(color1, color2) {
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Checks if a color provides sufficient contrast against a background color.
 * Based on WCAG AA (4.5:1 for normal text).
 */
export function isContrastAcceptable(color, background, threshold = 4.5) {
  return getContrastRatio(color, background) >= threshold;
}

/**
 * Mixes two colors in RGB space (simplified approximation of color-mix in oklch).
 * @param {string} color1 Hex color
 * @param {string} color2 Hex color
 * @param {number} weight Percentage of color1 (0 to 100)
 * @returns {string} Hex color
 */
export function mixColors(color1, color2, weight) {
  const p = weight / 100;
  const rgb1 = color1
    .replace(/^#/, "")
    .match(/.{2}/g)
    .map((x) => parseInt(x, 16));
  const rgb2 = color2
    .replace(/^#/, "")
    .match(/.{2}/g)
    .map((x) => parseInt(x, 16));

  const mixed = rgb1.map((c1, i) => Math.round(c1 * p + rgb2[i] * (1 - p)));

  return `#${mixed.map((x) => x.toString(16).padStart(2, "0")).join("")}`;
}

/**
 * Ensures an origin has a protocol and returns a base URL.
 * If no protocol is present, it defaults to https.
 * @param {string} origin The origin string.
 * @param {string} fallback Default fallback if origin is missing.
 * @returns {string} The normalized origin.
 */
export function normalizeOrigin(origin, fallback) {
  let base = origin || fallback;
  if (base && !base.startsWith("http://") && !base.startsWith("https://")) {
    base = `https://${base}`;
  }
  return base;
}

/**
 * Enhanced fetch with a timeout using AbortController.
 * @param {string} url The URL to fetch.
 * @param {object} options Fetch options.
 * @param {number} timeout Timeout in milliseconds (default 20000).
 * @returns {Promise<Response>} The fetch response.
 */
/**
 * Utility to convert an array-like buffer to a base64 string (browser compatible).
 */
export function arrayBufferToBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Utility to convert a base64 string to a Uint8Array (browser compatible).
 */
export function base64ToUint8Array(base64) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function fetchWithTimeout(url, options = {}, timeout = 20000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}
