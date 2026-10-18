import "server-only";
import { serverConfig } from "./config";

/** "https://varaq.javon.uz" on the store's own host, else "https://javon.uz/s/varaq". */
export function storeOrigin(h: Headers, slug: string): string {
  if (h.get("x-javon-store-host") === slug) {
    const proto = h.get("x-forwarded-proto") ?? (serverConfig.appUrl.startsWith("https") ? "https" : "http");
    return `${proto}://${h.get("host")}`;
  }
  return `${serverConfig.appUrl}/s/${slug}`;
}
