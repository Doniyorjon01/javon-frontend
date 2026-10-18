"use client";

import { useState } from "react";
import { useApp } from "@/components/app";
import { useStore } from "./store";
import {
  asTheme,
  HoursEditor,
  LogoUploader,
  StorePreview,
  ThemePicker,
  type Hours,
  type ThemeKey,
} from "./store-forms";
import { IPin } from "@/components/icons";
import { ErrorBox, Field, Spinner, Switch } from "@/components/ui";
import { ApiError, api } from "@/lib/api";
import { currency, groupDigits, hostOf, parseSom, prettyPhone } from "@/lib/format";
import { fmt, LANGS, type Lang } from "@/lib/i18n";
import type { TenantOut, TenantUpdate } from "@/lib/types";


/** PATCH /tenants/{id} with only what the section changed. */
export function useSaveTenant() {
  const { d, toast } = useApp();
  const { id, setTenant } = useStore();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  async function save(patch: TenantUpdate): Promise<boolean> {
    setBusy(true);
    setError(null);
    try {
      setTenant(await api<TenantOut>(`/tenants/${id}`, { method: "PATCH", json: patch }));
      toast(d.common.saved, "ok");
      return true;
    } catch (e) {
      setError(e as ApiError);
      return false;
    } finally {
      setBusy(false);
    }
  }
  return { save, busy, error };
}

function SaveBar({ busy, error, disabled }: { busy: boolean; error: ApiError | null; disabled?: boolean }) {
  const { d } = useApp();
  return (
    <div className="stack-sm">
      <ErrorBox error={error} />
      <button className="btn btn-primary" style={{ alignSelf: "flex-start" }} disabled={busy || disabled}>
        {busy && <Spinner />} {d.common.save}
      </button>
    </div>
  );
}

export function StoreSection() {
  const { d } = useApp();
  const { tenant, readOnly, siteUrl } = useStore();
  const [name, setName] = useState(tenant.name);
  const [langs, setLangs] = useState<Lang[]>(tenant.languages as Lang[]);
  const { save, busy, error } = useSaveTenant();
  return (
    <form
      className="card stack"
      onSubmit={(e) => {
        e.preventDefault();
        void save({ name: name.trim(), languages: langs });
      }}
    >
      <Field label={d.settings.name}>
        <input className="inp" value={name} onChange={(e) => setName(e.target.value)} minLength={2} maxLength={80} required disabled={readOnly} />
      </Field>
      <Field label={d.settings.slug} hint={d.settings.slugFixed}>
        <input className="inp mono" value={hostOf(siteUrl)} disabled />
      </Field>
      <div className="field">
        <span>{d.settings.languages}</span>
        <div className="chips">
          {LANGS.map((l) => {
            const on = langs.includes(l);
            return (
              <button
                type="button"
                key={l}
                className={`chip ${on ? "on" : ""}`}
                aria-pressed={on}
                disabled={readOnly || (on && langs.length === 1)}
                onClick={() => setLangs(on ? langs.filter((x) => x !== l) : [...langs, l])}
              >
                {d.langName[l]}
              </button>
            );
          })}
        </div>
        <span className="hint">{d.settings.languagesHint}</span>
      </div>
      <div className="field">
        <span>{d.settings.logo}</span>
        <LogoUploader />
      </div>
      <SaveBar busy={busy} error={error} disabled={readOnly} />
    </form>
  );
}

export function LookSection({ onSaved }: { onSaved?: () => void }) {
  const { d } = useApp();
  const { tenant, readOnly, siteUrl } = useStore();
  const [look, setLook] = useState<{ theme: ThemeKey; accent: string }>({ theme: asTheme(tenant.theme), accent: tenant.accent_color });
  const { save, busy, error } = useSaveTenant();
  return (
    <form
      className="grid-2"
      style={{ alignItems: "start" }}
      onSubmit={async (e) => {
        e.preventDefault();
        if (await save({ theme: look.theme, accent_color: look.accent })) onSaved?.();
      }}
    >
      <div className="card stack">
        <ThemePicker theme={look.theme} accent={look.accent} onChange={setLook} disabled={readOnly} />
        <SaveBar busy={busy} error={error} disabled={readOnly} />
      </div>
      <div className="card">
        <StorePreview name={tenant.name} theme={look.theme} accent={look.accent} logo={tenant.logo?.s} siteUrl={siteUrl} />
        <span className="sr-only">{d.setup.preview}</span>
      </div>
    </form>
  );
}

export function ContactsSection({ onSaved }: { onSaved?: () => void }) {
  const { d } = useApp();
  const { tenant, readOnly } = useStore();
  const [f, setF] = useState({
    phone: tenant.phone ? prettyPhone(tenant.phone) : "",
    address: tenant.address ?? "",
    lat: tenant.latitude != null ? String(tenant.latitude) : "",
    lon: tenant.longitude != null ? String(tenant.longitude) : "",
    telegram: tenant.telegram_username ?? "",
    instagram: tenant.instagram_username ?? "",
  });
  const [hours, setHours] = useState<Hours | null>(tenant.working_hours ?? null);
  const [locBusy, setLocBusy] = useState(false);
  const { save, busy, error } = useSaveTenant();
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  function myLocation() {
    if (!navigator.geolocation) return;
    setLocBusy(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setF((x) => ({ ...x, lat: p.coords.latitude.toFixed(6), lon: p.coords.longitude.toFixed(6) }));
        setLocBusy(false);
      },
      () => setLocBusy(false),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  return (
    <form
      className="card stack"
      onSubmit={async (e) => {
        e.preventDefault();
        const lat = f.lat.trim() ? Number(f.lat) : null;
        const lon = f.lon.trim() ? Number(f.lon) : null;
        const ok = await save({
          phone: f.phone.trim(),
          address: f.address.trim(),
          latitude: lat,
          longitude: lon,
          telegram_username: f.telegram.trim(),
          instagram_username: f.instagram.trim(),
          ...(hours ? { working_hours: hours } : {}),
        });
        if (ok) onSaved?.();
      }}
    >
      <div className="grid-2">
        <Field label={d.settings.phone} optional>
          <input className="inp" type="tel" value={f.phone} onChange={set("phone")} placeholder={d.settings.phonePh} disabled={readOnly} />
        </Field>
        <Field label={d.settings.address} optional>
          <input className="inp" value={f.address} onChange={set("address")} maxLength={255} placeholder={d.settings.addressPh} disabled={readOnly} />
        </Field>
      </div>
      <div className="field">
        <span>{d.settings.location}</span>
        <div className="row" style={{ alignItems: "flex-end" }}>
          <Field label={<span className="xs muted">{d.settings.latitude}</span>}>
            <input className="inp mono" inputMode="decimal" value={f.lat} onChange={set("lat")} disabled={readOnly} style={{ maxWidth: 170 }} />
          </Field>
          <Field label={<span className="xs muted">{d.settings.longitude}</span>}>
            <input className="inp mono" inputMode="decimal" value={f.lon} onChange={set("lon")} disabled={readOnly} style={{ maxWidth: 170 }} />
          </Field>
          <button type="button" className="btn btn-soft btn-sm" onClick={myLocation} disabled={readOnly || locBusy} style={{ marginBottom: 4 }}>
            {locBusy ? <Spinner /> : <IPin size={16} />} {d.settings.useMyLocation}
          </button>
        </div>
        <span className="hint">{d.settings.locationHint}</span>
      </div>
      <div className="grid-2">
        <Field label={d.settings.telegram} optional>
          <div className="inp-wrap">
            <span className="suffix">@</span>
            <input value={f.telegram.replace(/^@/, "")} onChange={(e) => setF({ ...f, telegram: e.target.value })} disabled={readOnly} style={{ fontWeight: 500, fontSize: 15 }} />
          </div>
        </Field>
        <Field label={d.settings.instagram} optional>
          <div className="inp-wrap">
            <span className="suffix">@</span>
            <input value={f.instagram.replace(/^@/, "")} onChange={(e) => setF({ ...f, instagram: e.target.value })} disabled={readOnly} style={{ fontWeight: 500, fontSize: 15 }} />
          </div>
        </Field>
      </div>
      <div className="field">
        <span>{d.settings.hours}</span>
        <HoursEditor value={hours} onChange={setHours} disabled={readOnly} />
      </div>
      <SaveBar busy={busy} error={error} disabled={readOnly} />
    </form>
  );
}

export function DeliverySection({ onSaved }: { onSaved?: () => void }) {
  const { d, lang } = useApp();
  const { tenant, readOnly } = useStore();
  const som = (t: number | null) => (t == null ? "" : groupDigits(String(Math.round(t / 100))));
  const [pickup, setPickup] = useState(tenant.pickup_enabled);
  const [delivery, setDelivery] = useState(tenant.delivery_enabled);
  const [fee, setFee] = useState(som(tenant.delivery_fee));
  const [freeFrom, setFreeFrom] = useState(som(tenant.free_delivery_from));
  const [area, setArea] = useState(tenant.delivery_area ?? "");
  const { save, busy, error } = useSaveTenant();
  return (
    <form
      className="card stack"
      onSubmit={async (e) => {
        e.preventDefault();
        const ok = await save({
          pickup_enabled: pickup,
          delivery_enabled: delivery,
          delivery_fee: parseSom(fee) ?? 0,
          free_delivery_from: freeFrom.trim() ? parseSom(freeFrom) : null,
          delivery_area: area.trim(),
        });
        if (ok) onSaved?.();
      }}
    >
      <label className="row-between">
        <span>
          <strong>{d.settings.pickup}</strong>
          {tenant.address && <span className="muted small"> · {tenant.address}</span>}
        </span>
        <Switch checked={pickup} onChange={setPickup} disabled={readOnly} label={d.settings.pickup} />
      </label>
      <hr className="divider" />
      <label className="row-between">
        <strong>{d.settings.delivery}</strong>
        <Switch checked={delivery} onChange={setDelivery} disabled={readOnly} label={d.settings.delivery} />
      </label>
      {delivery && (
        <div className="grid-2">
          <Field label={d.settings.deliveryFee}>
            <div className="inp-wrap">
              <input inputMode="numeric" value={fee} onChange={(e) => setFee(groupDigits(e.target.value))} disabled={readOnly} placeholder="0" />
              <span className="suffix">{currency(lang)}</span>
            </div>
          </Field>
          <Field label={d.settings.freeFrom} hint={d.settings.freeFromHint} optional>
            <div className="inp-wrap">
              <input inputMode="numeric" value={freeFrom} onChange={(e) => setFreeFrom(groupDigits(e.target.value))} disabled={readOnly} />
              <span className="suffix">{currency(lang)}</span>
            </div>
          </Field>
          <Field label={d.settings.deliveryArea} optional>
            <input className="inp" value={area} onChange={(e) => setArea(e.target.value)} maxLength={300} placeholder={d.settings.deliveryAreaPh} disabled={readOnly} />
          </Field>
        </div>
      )}
      {!pickup && !delivery && <div className="note note-warn small">{d.settings.needOneFulfilment}</div>}
      <SaveBar busy={busy} error={error} disabled={readOnly || (!pickup && !delivery)} />
    </form>
  );
}

export function PaymentSection({ onSaved }: { onSaved?: () => void }) {
  const { d } = useApp();
  const { tenant, readOnly } = useStore();
  const [cash, setCash] = useState(tenant.cash_enabled);
  const [card, setCard] = useState(tenant.card_transfer_enabled);
  const [number, setNumber] = useState((tenant.card_number ?? "").replace(/(\d{4})(?=\d)/g, "$1 "));
  const [holder, setHolder] = useState(tenant.card_holder ?? "");
  const { save, busy, error } = useSaveTenant();
  return (
    <form
      className="card stack"
      onSubmit={async (e) => {
        e.preventDefault();
        const ok = await save({
          cash_enabled: cash,
          card_transfer_enabled: card,
          card_number: number.replace(/\D/g, ""),
          card_holder: holder.trim(),
        });
        if (ok) onSaved?.();
      }}
    >
      <label className="row-between">
        <span>
          <strong>{d.settings.cash}</strong>
          <br />
          <span className="muted small">{d.settings.cashHint}</span>
        </span>
        <Switch checked={cash} onChange={setCash} disabled={readOnly} label={d.settings.cash} />
      </label>
      <hr className="divider" />
      <label className="row-between" style={{ alignItems: "flex-start" }}>
        <span style={{ maxWidth: 560 }}>
          <strong>{d.settings.card}</strong>
          <br />
          <span className="muted small">{fmt(d.settings.cardHint, { hours: 24 })}</span>
        </span>
        <Switch checked={card} onChange={setCard} disabled={readOnly} label={d.settings.card} />
      </label>
      {card && (
        <div className="grid-2">
          <Field label={d.settings.cardNumber}>
            <input
              className="inp mono"
              inputMode="numeric"
              value={number}
              onChange={(e) => setNumber(e.target.value.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 "))}
              placeholder="8600 0000 0000 0000"
              required
              disabled={readOnly}
            />
          </Field>
          <Field label={d.settings.cardHolder}>
            <input className="inp" value={holder} onChange={(e) => setHolder(e.target.value)} minLength={3} maxLength={80} required disabled={readOnly} />
          </Field>
        </div>
      )}
      {!cash && !card && <div className="note note-warn small">{d.settings.needOnePayment}</div>}
      <SaveBar busy={busy} error={error} disabled={readOnly || (!cash && !card)} />
    </form>
  );
}

