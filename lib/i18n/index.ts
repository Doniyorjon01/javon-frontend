import en from "./en";
import ru from "./ru";
import uz from "./uz";

export type Lang = "uz" | "ru" | "en";
export const LANGS: Lang[] = ["uz", "ru", "en"];
export const DEFAULT_LANG: Lang = "uz";
export const LANG_COOKIE = "javon_lang";

/** Every language has exactly the keys of uz.ts (TypeScript checks ru.ts and en.ts). */
type Widen<T> = T extends string ? string : T extends readonly (infer U)[] ? Widen<U>[] : { [K in keyof T]: Widen<T[K]> };
export type Dict = Widen<typeof uz>;

export const DICTS: Record<Lang, Dict> = { uz, ru, en };

export function asLang(value: string | null | undefined): Lang | null {
  const v = (value ?? "").toLowerCase().slice(0, 2);
  return (LANGS as string[]).includes(v) ? (v as Lang) : null;
}

/** "Bugun {open}–{close} ochiq" + {open: "10:00", close: "21:00"} */
export function fmt(template: string, vars: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
}

/** Accept-Language: "ru-RU,ru;q=0.9,en;q=0.8" -> "ru" */
export function langFromAcceptLanguage(header: string | null): Lang | null {
  if (!header) return null;
  for (const part of header.split(",")) {
    const lang = asLang(part.trim().split(";")[0]);
    if (lang) return lang;
  }
  return null;
}
