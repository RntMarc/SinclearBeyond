/**
 * @file Shared image processing utilities for the Sinclear Beyond project.
 * Converts images to AVIF, resizes to fit within dimension limits,
 * and iteratively compresses to stay within a maximum file size.
 * All database-bound image uploads MUST use this module.
 *
 * @module @/lib/images/imageProcessing
 */

import sharp from "sharp";

/** Maximum image width in pixels. @type {number} */
export const MAX_WIDTH = 1920;

/** Maximum image height in pixels. @type {number} */
export const MAX_HEIGHT = 1920;

/** Maximum file size in kilobytes. @type {number} */
export const MAX_FILE_SIZE_KB = 500;

/** Starting AVIF quality (0–100). @type {number} */
const INITIAL_QUALITY = 80;

/** Minimum AVIF quality before giving up. @type {number} */
const MIN_QUALITY = 10;

/** Quality delta per compression step. @type {number} */
const QUALITY_STEP = 10;

/**
 * Extracts the raw base64 payload from a data URL.
 *
 * @param {string} dataUrl - A base64 data URL (e.g. `"data:image/png;base64,iVBOR…"`).
 * @returns {string|null} The raw base64 string, or `null` for invalid input.
 */
function extractBase64(dataUrl) {
  if (typeof dataUrl !== "string") return null;
  const comma = dataUrl.indexOf(",");
  if (comma === -1 || !dataUrl.startsWith("data:")) return null;
  return dataUrl.slice(comma + 1);
}

/**
 * Resolves various image input types to a Node.js `Buffer`.
 *
 * @param {File|Buffer|string} input - A browser `File`, a Node.js `Buffer`,
 *   or a base64 data URL string.
 * @returns {Promise<Buffer>} The raw image bytes.
 * @throws {Error} If the input type is unsupported or decoding fails.
 */
async function resolveBuffer(input) {
  if (typeof File !== "undefined" && input instanceof File) {
    return Buffer.from(await input.arrayBuffer());
  }
  if (Buffer.isBuffer(input)) {
    return input;
  }
  if (typeof input === "string") {
    const raw = extractBase64(input);
    if (!raw) throw new Error("Invalid base64 data URL");
    return Buffer.from(raw, "base64");
  }
  throw new Error("Input must be a File, Buffer, or base64 data URL string");
}

/**
 * Server-side image processing pipeline.
 *
 * Steps:
 *  1. Converts the image to **AVIF** (modern format with superior compression).
 *  2. Resizes if dimensions exceed `maxWidth` or `maxHeight` (preserves aspect ratio).
 *  3. Iteratively reduces quality until the file size fits within `maxFileSizeKB`.
 *  4. Returns the result as a base64 data URL, ready for database storage.
 *
 * @param {File|Buffer|string} input - Source image: a browser `File`, a Node.js
 *   `Buffer`, or a base64 data URL string.
 * @param {object} [options] - Optional overrides for default limits.
 * @param {number} [options.maxWidth=MAX_WIDTH] - Maximum width in pixels.
 * @param {number} [options.maxHeight=MAX_HEIGHT] - Maximum height in pixels.
 * @param {number} [options.maxFileSizeKB=MAX_FILE_SIZE_KB] - Maximum file size in KB.
 * @returns {Promise<string>} Processed image as `data:image/avif;base64,…`.
 * @throws {Error} If processing fails (invalid image, sharp error, etc.).
 */
export async function processImage(input, options = {}) {
  const maxWidth = options.maxWidth ?? MAX_WIDTH;
  const maxHeight = options.maxHeight ?? MAX_HEIGHT;
  const maxFileSizeBytes = (options.maxFileSizeKB ?? MAX_FILE_SIZE_KB) * 1024;

  const buffer = await resolveBuffer(input);
  const metadata = await sharp(buffer).metadata();

  const resizeOptions = {};
  if (
    metadata.width &&
    metadata.height &&
    (metadata.width > maxWidth || metadata.height > maxHeight)
  ) {
    resizeOptions.width = maxWidth;
    resizeOptions.height = maxHeight;
    resizeOptions.fit = "inside";
    resizeOptions.withoutEnlargement = true;
  }

  let quality = INITIAL_QUALITY;
  let processedBuffer;

  do {
    let pipeline = sharp(buffer);
    if (Object.keys(resizeOptions).length > 0) {
      pipeline = pipeline.resize(resizeOptions);
    }
    processedBuffer = await pipeline.avif({ quality }).toBuffer();

    if (processedBuffer.length <= maxFileSizeBytes) break;
    quality -= QUALITY_STEP;
  } while (quality >= MIN_QUALITY);

  return `data:image/avif;base64,${processedBuffer.toString("base64")}`;
}

/**
 * Convenience wrapper around {@link processImage} that accepts a base64 data URL.
 *
 * @param {string} dataUrl - Base64 data URL to process.
 * @param {object} [options] - Optional overrides (see {@link processImage}).
 * @returns {Promise<string>} Processed AVIF base64 data URL.
 */
export async function processBase64Image(dataUrl, options = {}) {
  return processImage(dataUrl, options);
}
