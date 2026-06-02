/**
 * @file Shared async action utilities for the Sinclear Beyond project.
 * Provides a unified wrapper for async operations (API calls, server actions)
 * that returns a consistent result envelope and standardized status constants.
 * Pairs with `@/components/ui/SubmitButton` for uniform loading/success/error UX.
 *
 * @module @/lib/asyncAction
 */

/**
 * Standardized async action lifecycle states.
 * Mirrors the visual states managed by `@/components/ui/SubmitButton`.
 */
export const ACTION_STATES = Object.freeze({
  IDLE: "idle",
  PENDING: "pending",
  SUCCESS: "success",
  ERROR: "error",
});

/**
 * Normalized action result envelope returned by {@link executeAction} and
 * {@link fetchAction}. Either `ok` is `true` and `data` is populated, or
 * `ok` is `false` and `error` holds a human-readable message.
 *
 * @template T
 * @typedef {{ok: true, data: T, error: null} | {ok: false, data: null, error: string|null}} ActionResult
 */

/**
 * Wraps an async function and converts thrown errors or unexpected return
 * values into a consistent {@link ActionResult} envelope. Never throws.
 *
 * If the resolved value already follows the `{ ok, data?, error? }` shape,
 * it is normalized. Otherwise the resolved value becomes `data` and `ok` is
 * set to `true`.
 *
 * @template T
 * @param {() => Promise<T>|T} asyncFn - The async (or sync) function to execute.
 * @returns {Promise<ActionResult<T>>} The normalized action result.
 */
export async function executeAction(asyncFn) {
  try {
    const value = await asyncFn();
    if (value && typeof value === "object" && "ok" in value) {
      if (value.ok) {
        return {
          ok: true,
          data: value.data !== undefined ? value.data : value,
          error: null,
        };
      }
      return {
        ok: false,
        data: null,
        error:
          typeof value.error === "string"
            ? value.error
            : value.error
              ? String(value.error)
              : null,
      };
    }
    return { ok: true, data: value, error: null };
  } catch (error) {
    return {
      ok: false,
      data: null,
      error:
        typeof error?.message === "string"
          ? error.message
          : error
            ? String(error)
            : null,
    };
  }
}

/**
 * Converts a `fetch` `Response` to a normalized {@link ActionResult} envelope.
 * Attempts to parse the body as JSON; falls back to `null` data on parse error.
 *
 * @template T
 * @param {Response} response - A fetch Response.
 * @param {object} [options]
 * @param {string} [options.fallbackError] - Default error string if none can
 *   be extracted from the response body.
 * @returns {Promise<ActionResult<T>>}
 */
export async function readFetchResponse(response, { fallbackError } = {}) {
  let body = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  if (response.ok) {
    return { ok: true, data: body, error: null };
  }
  const errMsg =
    (body && typeof body === "object" && (body.error || body.message)) ||
    (typeof body === "string" && body) ||
    response.statusText ||
    fallbackError ||
    null;
  return { ok: false, data: null, error: errMsg };
}

/**
 * Convenience wrapper around `fetch` + {@link readFetchResponse}. Never
 * throws; network errors are returned in the `error` field.
 *
 * @template T
 * @param {string} url - The endpoint to call.
 * @param {RequestInit} [init] - Optional fetch init options.
 * @param {object} [options]
 * @param {string} [options.fallbackError] - Default error string when no
 *   more specific message is available.
 * @returns {Promise<ActionResult<T>>}
 */
export async function fetchAction(url, init, options) {
  try {
    const response = await fetch(url, init);
    return await readFetchResponse(response, options);
  } catch (error) {
    return {
      ok: false,
      data: null,
      error:
        typeof error?.message === "string"
          ? error.message
          : error
            ? String(error)
            : null,
    };
  }
}
