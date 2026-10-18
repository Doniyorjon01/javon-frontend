"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, api, withQuery } from "./api";

type Query = Record<string, string | number | boolean | null | undefined>;

/**
 * GET an API path and keep the result. `path = null` waits (e.g. until a
 * dependency is known). Old data stays visible while a new key loads.
 */
export function useApi<T>(path: string | null, query?: Query) {
  const key = path ? withQuery(path, query) : null;
  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState<boolean>(!!key);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!key) return;
    const ctrl = new AbortController();
    setLoading(true);
    api<T>(key, { signal: ctrl.signal })
      .then((d) => {
        setData(d);
        setError(null);
      })
      .catch((e) => {
        if ((e as Error).name === "AbortError") return;
        setError(e instanceof ApiError ? e : new ApiError(0, { code: "unknown_error", message: String(e) }));
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });
    return () => ctrl.abort();
  }, [key, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { data, setData, error, loading, reload };
}

export function useDebounced<T>(value: T, ms = 300): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}

/** Calls fn every `ms` while the tab is visible. */
export function useInterval(fn: () => void, ms: number | null) {
  const ref = useRef(fn);
  ref.current = fn;
  useEffect(() => {
    if (ms === null) return;
    const id = setInterval(() => {
      if (document.visibilityState === "visible") ref.current();
    }, ms);
    return () => clearInterval(id);
  }, [ms]);
}
