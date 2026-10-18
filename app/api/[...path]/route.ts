/**
 * Same-origin bridge to the FastAPI backend
 * =========================================
 * The browser always talks to /api/... on the site it is on, and this handler
 * forwards the request to API_URL. So the session cookie stays first-party,
 * there is no CORS to configure for the admin panel, and store subdomains reach
 * the public storefront API the same way (proxy.ts lets only /api/storefront
 * through on a store host).
 *
 * CSRF stays with the backend: it checks that every cookie-authenticated write
 * carries an Origin from CORS_ORIGINS. The browser's own Origin is forwarded;
 * only a same-origin request (Origin host == Host) arriving under another name
 * than APP_URL (127.0.0.1 instead of localhost) is relabelled as APP_URL, which
 * never helps a foreign site.
 */
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const API_URL = (process.env.API_URL ?? "http://127.0.0.1:8010").trim().replace(/\/+$/, "");
const APP_URL = (process.env.APP_URL ?? "http://localhost:3000").trim().replace(/\/+$/, "");

const FORWARD_REQUEST = [
  "accept",
  "accept-language",
  "content-type",
  "if-none-match",
  "x-telegram-init-data",
  "x-request-id",
  "user-agent",
];
const FORWARD_RESPONSE = [
  "content-type",
  "content-disposition",
  "cache-control",
  "etag",
  "retry-after",
  "x-request-id",
  "content-language",
];

function sameOriginAsHost(origin: string, host: string | null): boolean {
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

async function forward(request: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  if (!path.length || path.some((p) => p === ".." || p === "." || p.includes("/"))) {
    return Response.json({ detail: { code: "not_found", message: "Not found" } }, { status: 404 });
  }
  // /internal/* is for Caddy only (on-demand TLS); never through the site.
  if (path[0] === "internal") {
    return Response.json({ detail: { code: "not_found", message: "Not found" } }, { status: 404 });
  }
  const search = request.nextUrl.search;
  const target = `${API_URL}/${path.map(encodeURIComponent).join("/")}${search}`;

  const headers = new Headers();
  for (const name of FORWARD_REQUEST) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  // The public storefront needs no session; keep the owner's cookie out of it.
  const isPublic = path[0] === "storefront";
  const cookie = request.headers.get("cookie");
  if (cookie && !isPublic) headers.set("cookie", cookie);

  const origin = request.headers.get("origin");
  if (origin) {
    headers.set("origin", sameOriginAsHost(origin, request.headers.get("host")) ? normaliseOrigin(origin) : origin);
  }
  // Rate limits (orders, sign-in) count per buyer IP: pass on what Caddy saw.
  const xff = request.headers.get("x-forwarded-for");
  if (xff) headers.set("x-forwarded-for", xff);
  const realIp = request.headers.get("x-real-ip");
  if (realIp) headers.set("x-real-ip", realIp);

  const method = request.method.toUpperCase();
  const hasBody = !["GET", "HEAD", "OPTIONS"].includes(method);

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method,
      headers,
      body: hasBody ? request.body : undefined,
      redirect: "manual",
      cache: "no-store",
      // Required by Node's fetch when the body is a stream.
      ...(hasBody ? { duplex: "half" } : {}),
    } as RequestInit);
  } catch {
    return Response.json(
      { detail: { code: "service_unavailable", message: "API is not reachable" } },
      { status: 503 },
    );
  }

  const out = new Headers();
  for (const name of FORWARD_RESPONSE) {
    const value = upstream.headers.get(name);
    if (value) out.set(name, value);
  }
  for (const c of upstream.headers.getSetCookie()) out.append("set-cookie", c);

  const empty = upstream.status === 204 || upstream.status === 304 || method === "HEAD";
  return new Response(empty ? null : upstream.body, { status: upstream.status, headers: out });
}

function normaliseOrigin(origin: string): string {
  // A same-origin request: the page is ours. Report it under the configured
  // site address so CORS_ORIGINS needs only that one entry.
  try {
    return new URL(APP_URL).origin;
  } catch {
    return origin;
  }
}

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const PATCH = forward;
export const DELETE = forward;
export const HEAD = forward;
