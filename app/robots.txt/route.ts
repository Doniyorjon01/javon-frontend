import { serverConfig } from "@/lib/config";

export const dynamic = "force-dynamic";

export function GET() {
  const body = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /admin",
    "Disallow: /system",
    "Disallow: /kirish",
    "Disallow: /taklif",
    "Disallow: /api",
    `Sitemap: ${serverConfig.appUrl}/sitemap.xml`,
    "",
  ].join("\n");
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
