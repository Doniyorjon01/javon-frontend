/**
 * Browser-side API client: every call goes to /api/... on the current site
 * (app/api/[...path]/route.ts forwards it to the backend with the cookie).
 *
 * Errors keep the backend's shape {"detail": {"code", "message", ...}}: the
 * message is already in the user's language (Accept-Language), the code is
 * what the UI switches on.
 */

export type ApiErrorDetail = {
  code: string;
  message: string;
  errors?: Array<{ loc?: Array<string | number>; msg?: string; type?: string }>;
  [extra: string]: unknown;
};

export class ApiError extends Error {
  status: number;
  code: string;
  detail: ApiErrorDetail;

  constructor(status: number, detail: ApiErrorDetail) {
    super(detail.message || detail.code);
    this.status = status;
    this.code = detail.code;
    this.detail = detail;
  }

  /**
   * What to show. The backend already translates validation problems into the
   * user's language, field name included («Telefon: ...»), and puts the first
   * one in `message`; when several fields are wrong, all of them (up to 3).
   */
  get readable(): string {
    const lines = [...new Set((this.detail.errors ?? []).map((e) => e.msg).filter((m): m is string => !!m))];
    if (lines.length > 1) return lines.slice(0, 3).join("\n");
    return this.message;
  }
}

let currentLang = "uz";
export function setApiLang(lang: string) {
  currentLang = lang;
}

type Options = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  json?: unknown;
  form?: FormData;
  headers?: Record<string, string>;
  query?: Record<string, string | number | boolean | null | undefined>;
  signal?: AbortSignal;
};

export function withQuery(path: string, query?: Options["query"]): string {
  if (!query) return path;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null || v === "") continue;
    params.set(k, String(v));
  }
  const s = params.toString();
  return s ? `${path}${path.includes("?") ? "&" : "?"}${s}` : path;
}

export async function api<T = unknown>(path: string, opts: Options = {}): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Accept-Language": currentLang,
    ...opts.headers,
  };
  let body: BodyInit | undefined;
  if (opts.json !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(opts.json);
  } else if (opts.form) {
    body = opts.form;
  }
  let res: Response;
  try {
    res = await fetch(`/api${withQuery(path, opts.query)}`, {
      method: opts.method ?? (body ? "POST" : "GET"),
      headers,
      body,
      credentials: "same-origin",
      cache: "no-store",
      signal: opts.signal,
    });
  } catch (e) {
    if ((e as Error).name === "AbortError") throw e;
    throw new ApiError(0, { code: "network_error", message: networkMessage() });
  }
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }
  if (!res.ok) {
    const detail = (data as { detail?: unknown } | null)?.detail;
    if (detail && typeof detail === "object" && "code" in (detail as object)) {
      throw new ApiError(res.status, detail as ApiErrorDetail);
    }
    if (res.status >= 502 && res.status <= 504) {
      // The proxy or tunnel answered, the backend did not (restart, timeout).
      throw new ApiError(res.status, { code: "server_unavailable", message: unavailableMessage() });
    }
    throw new ApiError(res.status, {
      code: res.status === 404 ? "not_found" : "unknown_error",
      message: typeof detail === "string" ? detail : `HTTP ${res.status}`,
    });
  }
  return data as T;
}

function networkMessage(): string {
  if (currentLang === "ru") return "Нет связи с сервером. Проверьте интернет и попробуйте снова.";
  if (currentLang === "en") return "Cannot reach the server. Check your connection and try again.";
  return "Server bilan aloqa yo'q. Internetni tekshirib, qayta urinib ko'ring.";
}

function unavailableMessage(): string {
  if (currentLang === "ru") return "Сервер сейчас не отвечает. Подождите немного и попробуйте снова.";
  if (currentLang === "en") return "The server is not responding right now. Wait a moment and try again.";
  return "Server hozir javob bermayapti. Biroz kutib, qayta urinib ko'ring.";
}

export function errorText(e: unknown): string {
  if (e instanceof ApiError) return e.readable;
  if (e instanceof Error) return e.message;
  return String(e);
}
