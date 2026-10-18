import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { ApiError } from "./api";
import { serverConfig } from "./config";
import { DICTS, type Lang } from "./i18n";
import { getLang } from "./i18n/server";
import { serverGetOrNull } from "./server-api";
import type { StorefrontOut } from "./types";

/** One fetch per request even when layout, page and metadata all ask. */
export const getStore = cache(async (slug: string, lang: string): Promise<StorefrontOut | null> => {
  if (!/^[a-z][a-z0-9-]{1,39}$/.test(slug)) return null;
  try {
    return await serverGetOrNull<StorefrontOut>(`/storefront/${slug}`, lang);
  } catch (e) {
    if (e instanceof ApiError && e.status === 422) return null;
    throw e;
  }
});

/** The store speaks only its own languages: fall back to its first one. */
export async function shopLang(store: StorefrontOut | null): Promise<Lang> {
  const lang = await getLang();
  if (!store) return lang;
  const langs = store.languages as Lang[];
  return langs.includes(lang) ? lang : (langs[0] ?? "uz");
}

export async function shopContext(slug: string) {
  const h = await headers();
  const onStoreHost = h.get("x-javon-store-host") === slug;
  const base = onStoreHost ? "" : `/s/${slug}`;
  const firstLang = await getLang();
  const store = await getStore(slug, firstLang);
  const lang = await shopLang(store);
  const storeAgain = store && lang !== firstLang ? await getStore(slug, lang) : store;
  const origin = onStoreHost
    ? `${serverConfig.appUrl.startsWith("https") ? "https" : "http"}://${h.get("host")}`
    : serverConfig.appUrl;
  return { store: storeAgain, lang, d: DICTS[lang], base, origin };
}
