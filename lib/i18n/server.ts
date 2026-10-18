import "server-only";
import { cookies, headers } from "next/headers";
import { DEFAULT_LANG, DICTS, LANG_COOKIE, asLang, langFromAcceptLanguage, type Lang } from "./index";

/** The visitor's language: their choice (cookie), else the browser's, else Uzbek. */
export async function getLang(): Promise<Lang> {
  const jar = await cookies();
  const fromCookie = asLang(jar.get(LANG_COOKIE)?.value);
  if (fromCookie) return fromCookie;
  const h = await headers();
  return langFromAcceptLanguage(h.get("accept-language")) ?? DEFAULT_LANG;
}

export async function getDict() {
  const lang = await getLang();
  return { lang, d: DICTS[lang] };
}
