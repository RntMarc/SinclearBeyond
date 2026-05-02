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
