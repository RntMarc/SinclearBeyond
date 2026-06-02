"use client";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * React hook that tracks a single async action's pending state and protects
 * against double-invocation (e.g. double clicks) via a `useRef` guard that
 * fires synchronously before React commits any re-render.
 *
 * Intended for icon-only or otherwise customized buttons that need loading
 * semantics without adopting the full `SubmitButton` visual contract.
 *
 * @returns {{
 *   loading: boolean,
 *   run: <T>(fn: () => Promise<T>) => Promise<T | undefined>
 * }} Hook API.
 */
export function useAsyncAction() {
  const [loading, setLoading] = useState(false);
  const inFlightRef = useRef(false);

  const run = useCallback(async (fn) => {
    if (inFlightRef.current) return undefined;
    inFlightRef.current = true;
    setLoading(true);
    try {
      return await fn();
    } finally {
      inFlightRef.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      inFlightRef.current = false;
    };
  }, []);

  return { loading, run };
}
