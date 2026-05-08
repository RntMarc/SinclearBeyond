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
 * @param {string} hex Hex color string (e.g. #7c3aed)
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
