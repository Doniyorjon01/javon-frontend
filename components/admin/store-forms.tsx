"use client";

/** Pieces of the store settings shared by the setup wizard and the settings page. */
import { useState } from "react";
import { ApiError, api } from "@/lib/api";
import { hostOf } from "@/lib/format";
import type { DayHours, TenantOut } from "@/lib/types";
import { useApp } from "../app";
import { BookCover } from "../book-cover";
import { ICart, IImage, ISearch, ITrash } from "../icons";
import { FilePick } from "../ui";
import { useStore } from "./store";

import { ACCENTS, accentFg, THEME_LOOK, THEMES, type ThemeKey } from "@/lib/theme";

export { accentFg, asTheme, type ThemeKey } from "@/lib/theme";

export function ThemePicker({
  theme,
  accent,
  onChange,
  disabled,
}: {
  theme: ThemeKey;
  accent: string;
  onChange: (v: { theme: ThemeKey; accent: string }) => void;
  disabled?: boolean;
}) {
  const { d } = useApp();
  return (
    <div className="stack">
      <div className="stack-sm">
        <strong className="small">{d.setup.design}</strong>
        <div className="grid-2" style={{ gap: 12 }}>
          {THEMES.map((t) => {
            const L = THEME_LOOK[t];
            return (
              <button
                type="button"
                key={t}
                disabled={disabled}
                className={`theme-card ${theme === t ? "on" : ""}`}
                aria-pressed={theme === t}
                onClick={() => onChange({ theme: t, accent: L.accent })}
              >
                <span className="sw" style={{ background: L.bg }}>
                  <span style={{ position: "absolute", left: 0, right: 0, top: 0, height: 16, background: L.head }} />
                  <span style={{ position: "absolute", left: 10, bottom: 8, width: 22, height: 32, borderRadius: "2px 4px 4px 2px", background: L.accent }} />
                  <span style={{ position: "absolute", left: 38, bottom: 8, width: 22, height: 32, borderRadius: "2px 4px 4px 2px", background: L.card, boxShadow: "inset 0 0 0 1px rgba(0,0,0,.08)" }} />
                </span>
                <strong style={{ fontFamily: L.serif ? "var(--f-serif)" : "var(--f-sans)" }}>{d.enums.theme[t]}</strong>
                <span className="muted xs">{d.enums.themeDesc[t]}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="stack-sm">
        <strong className="small">
          {d.setup.accent} <span className="mono muted">{accent}</span>
        </strong>
        <div className="row" style={{ gap: 10 }}>
          {ACCENTS.map((c) => (
            <button
              type="button"
              key={c}
              disabled={disabled}
              className={`swatch ${accent.toLowerCase() === c.toLowerCase() ? "on" : ""}`}
              style={{ background: c }}
              aria-label={c}
              aria-pressed={accent.toLowerCase() === c.toLowerCase()}
              onClick={() => onChange({ theme, accent: c })}
            />
          ))}
          <label className="swatch" style={{ background: "conic-gradient(red, yellow, lime, aqua, blue, magenta, red)", position: "relative", overflow: "hidden" }} title="#">
            <input
              type="color"
              value={accent}
              disabled={disabled}
              onChange={(e) => onChange({ theme, accent: e.target.value.toUpperCase() })}
              style={{ opacity: 0, position: "absolute", inset: 0, width: "100%", height: "100%", cursor: "pointer" }}
            />
          </label>
        </div>
      </div>
    </div>
  );
}

const SAMPLE = [
  ["O'tkan kunlar", "Abdulla Qodiriy", "65 000"],
  ["Sarob", "Abdulla Qahhor", "58 000"],
  ["Shum bola", "G'afur G'ulom", "49 000"],
  ["Dunyoning ishlari", "O'tkir Hoshimov", "72 000"],
];

/** A small live picture of the store site with the chosen look. */
export function StorePreview({ name, theme, accent, logo, siteUrl }: { name: string; theme: ThemeKey; accent: string; logo?: string | null; siteUrl: string }) {
  const { d } = useApp();
  const [device, setDevice] = useState<"desk" | "phone">("desk");
  const L = THEME_LOOK[theme];
  const fg = accentFg(accent);
  const font = L.serif ? "var(--f-serif)" : "var(--f-sans)";
  const cols = device === "desk" ? 4 : 2;
  return (
    <div className="stack-sm">
      <div className="row-between">
        <strong className="small">{d.setup.preview}</strong>
        <div className="seg">
          <button type="button" className={device === "desk" ? "on" : ""} onClick={() => setDevice("desk")}>{d.setup.desktop}</button>
          <button type="button" className={device === "phone" ? "on" : ""} onClick={() => setDevice("phone")}>{d.setup.phone}</button>
        </div>
      </div>
      <div className="preview-frame" style={{ maxWidth: device === "phone" ? 300 : "100%", margin: "0 auto", width: "100%" }}>
        <div className="preview-bar">
          <i /><i /><i /> <span className="mono" style={{ marginLeft: 6 }}>{hostOf(siteUrl)}</span>
        </div>
        <div style={{ background: L.bg, color: L.fg, padding: 14, minHeight: 300 }}>
          <div className="row-between" style={{ marginBottom: 12 }}>
            <span className="row" style={{ gap: 8 }}>
              <span style={{ width: 28, height: 28, borderRadius: 8, background: accent, color: fg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: font, fontWeight: 700, overflow: "hidden" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {logo ? <img src={logo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (name || "J").slice(0, 1).toUpperCase()}
              </span>
              <strong style={{ fontFamily: font, fontSize: 15 }}>{name || "—"}</strong>
            </span>
            <span style={{ background: accent, color: fg, borderRadius: 999, padding: "4px 10px", fontSize: 11, fontWeight: 600, display: "inline-flex", gap: 4, alignItems: "center" }}>
              <ICart size={12} /> 0
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, border: `1.5px solid ${theme === "night" ? "#3d424b" : "rgba(0,0,0,.15)"}`, background: L.card, borderRadius: 999, padding: "6px 10px", fontSize: 11, opacity: 0.85, marginBottom: 14 }}>
            <ISearch size={12} /> {d.shop.searchPh}
          </div>
          <strong style={{ fontFamily: font, fontSize: 18, display: "block", marginBottom: 10 }}>{d.shop.newArrivals}</strong>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 10 }}>
            {SAMPLE.slice(0, cols === 2 ? 4 : 4).map(([t, a, p]) => (
              <div key={t} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <BookCover title={t} authors={[a]} style={{ fontSize: 6 }} />
                <span style={{ fontSize: 10.5, fontWeight: 600, lineHeight: 1.2 }}>{t}</span>
                <span style={{ fontSize: 10.5 }}>{p} so&apos;m</span>
                <span style={{ background: accent, color: fg, borderRadius: 6, fontSize: 9.5, fontWeight: 600, textAlign: "center", padding: "4px 0" }}>{d.shop.addToCart}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <span className="muted xs" style={{ textAlign: "center" }}>{d.setup.previewNote}</span>
    </div>
  );
}

export function LogoUploader() {
  const { d, toast } = useApp();
  const { id, tenant, setTenant, readOnly } = useStore();
  const [busy, setBusy] = useState(false);
  const logo = tenant.logo?.l ?? tenant.logo?.s;

  async function upload(file: File) {
    setBusy(true);
    const form = new FormData();
    form.append("file", file);
    try {
      setTenant(await api<TenantOut>(`/tenants/${id}/logo`, { method: "PUT", form }));
      toast(d.common.saved, "ok");
    } catch (e) {
      toast((e as ApiError).readable, "err");
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    setBusy(true);
    try {
      setTenant(await api<TenantOut>(`/tenants/${id}/logo`, { method: "DELETE" }));
    } catch (e) {
      toast((e as ApiError).readable, "err");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="drop" style={{ cursor: "default" }}>
      <span className="logo-prev" style={{ background: logo ? "#fff" : tenant.accent_color, color: accentFg(tenant.accent_color) }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {logo ? <img src={logo} alt="" /> : tenant.name.slice(0, 1).toUpperCase()}
      </span>
      <div className="stack-sm grow">
        <span className="small muted">{d.setup.logoText}</span>
        <div className="row" style={{ gap: 8 }}>
          <FilePick
            accept="image/jpeg,image/png,image/webp"
            busy={busy || readOnly}
            onFile={upload}
            className="btn btn-ink btn-sm"
            label={
              <>
                <IImage size={16} /> {logo ? d.common.replace : d.settings.uploadLogo}
              </>
            }
          />
          {logo && (
            <button type="button" className="btn btn-danger btn-sm" disabled={busy || readOnly} onClick={remove}>
              <ITrash size={16} /> {d.settings.removeLogo}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export const WEEKDAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export type Hours = Record<string, DayHours | null>;

export function HoursEditor({ value, onChange, disabled }: { value: Hours | null; onChange: (v: Hours) => void; disabled?: boolean }) {
  const { d } = useApp();
  const v: Hours = value ?? {};
  const set = (day: string, h: DayHours | null) => onChange({ ...Object.fromEntries(WEEKDAYS.map((w) => [w, v[w] ?? null])), [day]: h });
  const hhmm = (t?: string) => (t ? t.slice(0, 5) : "");
  return (
    <div className="hours">
      {WEEKDAYS.map((day) => {
        const h = v[day] ?? null;
        return (
          <div key={day} className="d">
            <span>{d.enums.weekday[day]}</span>
            <label className="row" style={{ gap: 6, fontSize: 13 }}>
              <input
                type="checkbox"
                disabled={disabled}
                checked={!!h}
                onChange={(e) => set(day, e.target.checked ? { open: "10:00", close: "20:00" } : null)}
                style={{ accentColor: "var(--cobalt)", width: 16, height: 16 }}
              />
              {h ? d.settings.open : d.settings.closed}
            </label>
            {h ? (
              <span className="row" style={{ gap: 6 }}>
                <input type="time" value={hhmm(h.open)} disabled={disabled} onChange={(e) => set(day, { ...h, open: e.target.value })} aria-label={`${d.enums.weekday[day]} open`} />
                –
                <input type="time" value={hhmm(h.close)} disabled={disabled} onChange={(e) => set(day, { ...h, close: e.target.value })} aria-label={`${d.enums.weekday[day]} close`} />
              </span>
            ) : (
              <span className="muted small">{d.settings.closed}</span>
            )}
          </div>
        );
      })}
      <button
        type="button"
        className="btn-link small"
        style={{ alignSelf: "flex-start" }}
        disabled={disabled}
        onClick={() => {
          const first = WEEKDAYS.map((w) => v[w]).find(Boolean) ?? { open: "10:00", close: "20:00" };
          onChange(Object.fromEntries(WEEKDAYS.map((w) => [w, { ...first }])));
        }}
      >
        {d.settings.copyToAll}
      </button>
    </div>
  );
}
