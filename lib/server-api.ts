import "server-only";
import { ApiError, type ApiErrorDetail, withQuery } from "./api";
import { serverConfig } from "./config";

/** Server Components: read the public API directly (storefront pages, plans). */
export async function serverGet<T>(
  path: string,
  lang: string,
  query?: Record<string, string | number | boolean | null | undefined>,
  init?: { headers?: Record<string, string>; revalidate?: number },
): Promise<T> {
  const res = await fetch(`${serverConfig.apiUrl}${withQuery(path, query)}`, {
    headers: { Accept: "application/json", "Accept-Language": lang, ...init?.headers },
    ...(init?.revalidate ? { next: { revalidate: init.revalidate } } : { cache: "no-store" as const }),
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const detail = data?.detail;
    throw new ApiError(
      res.status,
      detail && typeof detail === "object" ? (detail as ApiErrorDetail) : { code: "unknown_error", message: String(detail) },
    );
  }
  return data as T;
}

/** null instead of an exception when the API answers 404 (store or book not found). */
export async function serverGetOrNull<T>(
  path: string,
  lang: string,
  query?: Record<string, string | number | boolean | null | undefined>,
): Promise<T | null> {
  try {
    return await serverGet<T>(path, lang, query);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}
