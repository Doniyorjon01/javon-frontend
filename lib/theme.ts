/** Store looks (themes) — plain data, used on the server and in the browser. */

export const THEMES = ["classic", "modern", "bright", "night"] as const;
export type ThemeKey = (typeof THEMES)[number];

/** Same values as the storefront CSS (.sf-theme-*). */
export const THEME_LOOK: Record<ThemeKey, { bg: string; head: string; headFg: string; fg: string; card: string; accent: string; serif: boolean }> = {
  classic: { bg: "#F4EFE4", head: "#1F4D3F", headFg: "#F4EFE4", fg: "#1F2128", card: "#FFFFFF", accent: "#1F4D3F", serif: true },
  modern: { bg: "#FFFFFF", head: "#15171C", headFg: "#FFFFFF", fg: "#15171C", card: "#F1F1EE", accent: "#2B3BD1", serif: false },
  bright: { bg: "#FFF6E5", head: "#E76F51", headFg: "#2B120A", fg: "#2B1D0E", card: "#FFFFFF", accent: "#B4472E", serif: false },
  night: { bg: "#16181D", head: "#0E0F12", headFg: "#EDEBE4", fg: "#EDEBE4", card: "#262930", accent: "#F0B23E", serif: true },
};

export const ACCENTS = ["#1F4D3F", "#2B3BD1", "#B4472E", "#6E2E3A", "#F0B23E", "#15171C", "#2A9D8F", "#E76F51"];

export function asTheme(t: string): ThemeKey {
  return (THEMES as readonly string[]).includes(t) ? (t as ThemeKey) : "classic";
}

/** Text colour that stays readable on the accent colour. */
export function accentFg(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  if (!Number.isFinite(n)) return "#FFFFFF";
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b > 160 ? "#15171C" : "#FFFFFF";
}
