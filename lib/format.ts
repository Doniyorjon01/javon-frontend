/** Numbers, money and dates as people in Uzbekistan read them. Money from the API is in tiyin. */

export const TZ = "Asia/Tashkent";
const LOCALES: Record<string, string> = { uz: "uz-Latn-UZ", ru: "ru-RU", en: "en-GB" };
const CURRENCY: Record<string, string> = { uz: "so'm", ru: "сум", en: "UZS" };

/** 6500000 -> "65 000" (grouped with a non-breaking space, no decimals unless needed). */
export function somNumber(tiyin: number): string {
  const som = tiyin / 100;
  const whole = Math.trunc(som);
  const grouped = Math.abs(whole)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const frac = Math.round(Math.abs(som - whole) * 100);
  return `${som < 0 ? "−" : ""}${grouped}${frac ? "," + String(frac).padStart(2, "0") : ""}`;
}

/** 6500000 -> "65 000 so'm" */
export function money(tiyin: number, lang = "uz"): string {
  return `${somNumber(tiyin)} ${CURRENCY[lang] ?? CURRENCY.uz}`;
}

export function currency(lang = "uz"): string {
  return CURRENCY[lang] ?? CURRENCY.uz;
}

/** "65 000" / "65000,50" typed by a person -> tiyin; null when it is not a number. */
export function parseSom(input: string): number | null {
  const s = input.replace(/[\s ']/g, "").replace(",", ".");
  if (!s) return null;
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  return Math.round(parseFloat(s) * 100);
}

export function groupDigits(input: string): string {
  const digits = input.replace(/\D/g, "");
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function locale(lang: string) {
  return LOCALES[lang] ?? LOCALES.uz;
}

// Node's and many browsers' ICU have no Uzbek month names ("M10 14"), so
// Uzbek dates are put together by hand from Tashkent-time numbers.
const UZ_MONTHS = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];
const UZ_MONTHS_SHORT = ["yan", "fev", "mar", "apr", "may", "iyn", "iyl", "avg", "sen", "okt", "noy", "dek"];

function tashkentParts(d: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(d);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return { y: get("year"), m: Number(get("month")) - 1, d: Number(get("day")), hh: get("hour"), mm: get("minute") };
}

export function dateTime(iso: string | null | undefined, lang = "uz"): string {
  if (!iso) return "—";
  if (lang === "uz") {
    const p = tashkentParts(new Date(iso));
    return `${p.d}-${UZ_MONTHS_SHORT[p.m]}, ${p.hh}:${p.mm}`;
  }
  return new Intl.DateTimeFormat(locale(lang), {
    timeZone: TZ,
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function dateOnly(iso: string | null | undefined, lang = "uz"): string {
  if (!iso) return "—";
  if (lang === "uz") {
    const p = tashkentParts(new Date(iso));
    return `${p.d}-${UZ_MONTHS[p.m]}, ${p.y}`;
  }
  return new Intl.DateTimeFormat(locale(lang), {
    timeZone: TZ,
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

export function timeOnly(iso: string, _lang = "uz"): string {
  const p = tashkentParts(new Date(iso));
  return `${p.hh}:${p.mm}`;
}

export function shortDay(isoDate: string, lang = "uz"): string {
  // "2026-10-14" is a calendar day already in Tashkent time.
  const [y, m, d] = isoDate.split("-").map(Number);
  if (lang === "uz") return `${d}-${UZ_MONTHS_SHORT[m - 1]}`;
  return new Intl.DateTimeFormat(locale(lang), { day: "numeric", month: "short", timeZone: "UTC" }).format(
    new Date(Date.UTC(y, m - 1, d)),
  );
}

export function daysUntil(iso: string | null | undefined): number | null {
  if (!iso) return null;
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
}

/** "+998901234567" -> "+998 90 123 45 67" */
export function prettyPhone(phone: string | null | undefined): string {
  if (!phone) return "—";
  const m = phone.match(/^\+998(\d{2})(\d{3})(\d{2})(\d{2})$/);
  return m ? `+998 ${m[1]} ${m[2]} ${m[3]} ${m[4]}` : phone;
}

/** "9789943000000" -> "978-9943-00-000-0" is publisher-specific; group simply. */
export function prettyIsbn(isbn: string | null | undefined): string {
  if (!isbn) return "";
  return isbn.length === 13 ? `${isbn.slice(0, 3)}-${isbn.slice(3, 7)}-${isbn.slice(7, 12)}-${isbn.slice(12)}` : isbn;
}

export function storeUrl(template: string, slug: string): string {
  return template.replace("{slug}", slug).replace(/\/+$/, "");
}

export function hostOf(url: string): string {
  try {
    const u = new URL(url);
    return u.host + (u.pathname !== "/" ? u.pathname : "");
  } catch {
    return url;
  }
}

/** Badge colour for a subscription state. */
export function accessBadge(state: string): string {
  return state === "active" || state === "trial" ? "b-ok" : state === "grace" ? "b-warn" : "b-err";
}
