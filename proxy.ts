/**
 * Store subdomains
 * ================
 * varaq.javon.uz/kitob/12  ->  /s/varaq/kitob/12   (the same pages as javon.uz/s/varaq)
 *
 * The backend never trusts the Host header (CLAUDE.md, "Vitrina API'si slug
 * bo'yicha"): the slug is read here and becomes part of the path. From a store
 * host only the public storefront API is reachable through /api; the admin API
 * answers 404 there, so a store site can never act with the owner's session.
 */
import { NextResponse, type NextRequest } from "next/server";

// Subdomains that are never stores (backend utils/slug.py RESERVED_SLUGS, the
// ones that resolve to something of ours).
const NOT_STORES = new Set(["www", "api", "media", "admin", "app", "static", "cdn"]);

export function storeSlugFromHost(hostHeader: string | null, baseDomain: string): string | null {
  const host = (hostHeader ?? "").split(":")[0].toLowerCase();
  const suffix = "." + baseDomain;
  if (!host.endsWith(suffix)) return null;
  const sub = host.slice(0, -suffix.length);
  if (!/^[a-z][a-z0-9-]{1,39}$/.test(sub) || NOT_STORES.has(sub)) return null;
  return sub;
}

export function proxy(request: NextRequest) {
  const base = (process.env.BASE_DOMAIN ?? "localhost").trim().toLowerCase();
  const slug = storeSlugFromHost(request.headers.get("host"), base);
  if (!slug) return NextResponse.next();

  const url = request.nextUrl.clone();
  if (url.pathname.startsWith("/api/")) {
    if (url.pathname.startsWith("/api/storefront/")) return NextResponse.next();
    return new NextResponse(null, { status: 404 });
  }
  if (url.pathname.startsWith("/s/")) return new NextResponse(null, { status: 404 });

  url.pathname = `/s/${slug}${url.pathname === "/" ? "" : url.pathname}`;
  const headers = new Headers(request.headers);
  headers.set("x-javon-store-host", slug);
  return NextResponse.rewrite(url, { request: { headers } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg).*)"],
};
