import { headers } from "next/headers";
import { serverGetOrNull } from "@/lib/server-api";
import { storeOrigin } from "@/lib/store-origin";
import type { SitemapEntry } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  if (!/^[a-z][a-z0-9-]{1,39}$/.test(slug)) return new Response(null, { status: 404 });
  const entries = await serverGetOrNull<SitemapEntry[]>(`/storefront/${slug}/sitemap`, "uz");
  if (!entries) return new Response(null, { status: 404 });
  const origin = storeOrigin(await headers(), slug);
  const urls = [
    `  <url><loc>${origin}/</loc></url>`,
    ...entries.map((e) => `  <url><loc>${origin}/kitob/${e.book_id}</loc><lastmod>${e.updated_at.slice(0, 10)}</lastmod></url>`),
  ];
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
  return new Response(body, { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=3600" } });
}
