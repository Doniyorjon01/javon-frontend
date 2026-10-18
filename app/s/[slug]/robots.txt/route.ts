import { headers } from "next/headers";
import { storeOrigin } from "@/lib/store-origin";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const origin = storeOrigin(await headers(), slug);
  const body = ["User-agent: *", "Allow: /", "Disallow: /savat", "Disallow: /buyurtma", "Disallow: /buyurtmalarim", `Sitemap: ${origin}/sitemap.xml`, ""].join("\n");
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
