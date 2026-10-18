"use client";

import Link from "next/link";
import { useState } from "react";
import { useApp } from "@/components/app";
import {
  ContactsSection,
  DeliverySection,
  LookSection,
  PaymentSection,
} from "@/components/admin/settings-sections";
import { OwnerOnly, PageHead } from "@/components/admin/shell";
import { useStore } from "@/components/admin/store";
import { LogoUploader } from "@/components/admin/store-forms";
import { IArrow, ICheck, IPlus, IQr, IRocket, IScan, IUpload } from "@/components/icons";
import { CopyButton, ErrorBox, Spinner } from "@/components/ui";
import { ApiError, api } from "@/lib/api";
import { hostOf } from "@/lib/format";
import { fmt } from "@/lib/i18n";
import { useApi } from "@/lib/hooks";
import type { BotOut, InventoryItemOut, Page, TenantOut } from "@/lib/types";

const STEPS = ["logo", "look", "contacts", "books", "delivery", "telegram", "launch"] as const;
type Step = (typeof STEPS)[number];

export default function SetupPage() {
  const { d } = useApp();
  const { id, base, tenant, setTenant, siteUrl, readOnly } = useStore();
  const [step, setStep] = useState<Step>("logo");
  const shelf = useApi<Page<InventoryItemOut>>(`/tenants/${id}/inventory`, { size: 1, in_stock: true });
  const bot = useApi<BotOut>(`/tenants/${id}/telegram`);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const done: Record<Step, boolean> = {
    logo: !!tenant.logo,
    look: tenant.theme !== "classic" || tenant.accent_color.toUpperCase() !== "#2B3BD1",
    contacts: !!(tenant.phone || tenant.address),
    books: (shelf.data?.total ?? 0) > 0,
    delivery: tenant.cash_enabled || tenant.card_transfer_enabled,
    telegram: !!bot.data,
    launch: !!tenant.launched_at,
  };
  const idx = STEPS.indexOf(step);
  const next = () => setStep(STEPS[Math.min(STEPS.length - 1, idx + 1)]);
  const back = () => setStep(STEPS[Math.max(0, idx - 1)]);

  async function launch() {
    setBusy(true);
    setError(null);
    try {
      setTenant(await api<TenantOut>(`/tenants/${id}/launch`, { method: "POST" }));
    } catch (e) {
      setError(e as ApiError);
    } finally {
      setBusy(false);
    }
  }

  const nav = (
    <div className="row-between" style={{ marginTop: 6 }}>
      <button className="btn btn-soft btn-sm" onClick={back} disabled={idx === 0}>
        {d.common.back}
      </button>
      <div className="row">
        <button className="btn-link small" onClick={next}>
          {d.common.later}
        </button>
        <button className="btn btn-ink btn-sm" onClick={next}>
          {d.common.continue} <IArrow className="arr" size={16} />
        </button>
      </div>
    </div>
  );

  return (
    <OwnerOnly note={d.settings.ownerOnly}>
      <PageHead title={d.setup.title} sub={fmt(d.setup.stepOf, { n: idx + 1, total: STEPS.length })} />
      <div className="wiz">
        <nav className="wiz-steps" aria-label={d.setup.title}>
          {STEPS.map((s, i) => (
            <button key={s} className={`wiz-step ${step === s ? "on" : ""} ${done[s] ? "done" : ""}`} onClick={() => setStep(s)} aria-current={step === s ? "step" : undefined}>
              <span className="n">{done[s] ? <ICheck size={14} /> : i + 1}</span>
              {d.setup.steps[s]}
            </button>
          ))}
          <p className="muted xs" style={{ padding: "10px 12px", whiteSpace: "normal" }}>{d.setup.skipNote}</p>
        </nav>

        <div className="stack" style={{ minWidth: 0 }}>
          {step === "logo" && (
            <div className="card stack">
              <h2>{d.setup.logoTitle}</h2>
              <LogoUploader />
              {nav}
            </div>
          )}
          {step === "look" && (
            <>
              <div>
                <h2 style={{ fontSize: 22 }}>{d.setup.lookTitle}</h2>
                <p className="muted">{d.setup.lookText}</p>
              </div>
              <LookSection onSaved={next} />
              {nav}
            </>
          )}
          {step === "contacts" && (
            <>
              <div>
                <h2 style={{ fontSize: 22 }}>{d.setup.contactsTitle}</h2>
                <p className="muted">{d.setup.contactsText}</p>
              </div>
              <ContactsSection onSaved={next} />
              {nav}
            </>
          )}
          {step === "books" && (
            <div className="card stack">
              <h2>{d.setup.booksTitle}</h2>
              <p className="muted">{d.setup.booksText}</p>
              <div className={`note ${done.books ? "note-ok" : "note-warn"}`}>
                {done.books ? fmt(d.setup.booksCount, { n: shelf.data?.total ?? 0 }) : d.setup.booksNone}
              </div>
              <div className="grid-3">
                <Link href={`${base}/books/add`} className="card card-tight lift stack-sm" style={{ textDecoration: "none", color: "inherit" }}>
                  <IPlus /> <strong>{d.add.tabs.search}</strong>
                </Link>
                <Link href={`${base}/books/add?tab=scan`} className="card card-tight lift stack-sm" style={{ textDecoration: "none", color: "inherit" }}>
                  <IScan /> <strong>{d.add.tabs.scan}</strong>
                </Link>
                <Link href={`${base}/books/import`} className="card card-tight lift stack-sm" style={{ textDecoration: "none", color: "inherit" }}>
                  <IUpload /> <strong>{d.admin.nav.import}</strong>
                </Link>
              </div>
              {nav}
            </div>
          )}
          {step === "delivery" && (
            <>
              <div>
                <h2 style={{ fontSize: 22 }}>{d.setup.deliveryTitle}</h2>
                <p className="muted">{d.setup.deliveryText}</p>
              </div>
              <DeliverySection />
              <PaymentSection />
              {nav}
            </>
          )}
          {step === "telegram" && (
            <div className="card stack">
              <h2>{d.setup.telegramTitle}</h2>
              <p className="muted">{d.setup.telegramText}</p>
              {bot.data ? (
                <div className="note note-ok">@{bot.data.username}</div>
              ) : (
                <Link href={`${base}/telegram`} className="btn btn-primary btn-sm" style={{ alignSelf: "flex-start" }}>
                  {d.setup.goTelegram} <IArrow className="arr" size={16} />
                </Link>
              )}
              {nav}
            </div>
          )}
          {step === "launch" && (
            <div className="card stack">
              {tenant.launched_at ? (
                <>
                  <span className="logo-prev" style={{ background: "var(--green-soft)", color: "var(--green-ink)" }}>
                    <ICheck size={32} />
                  </span>
                  <h2 style={{ fontSize: 24 }}>{d.setup.launchedTitle}</h2>
                  <p className="muted">{d.setup.launchedText}</p>
                  <div className="row">
                    <a href={siteUrl} target="_blank" rel="noreferrer" className="badge b-info mono" style={{ fontSize: 15 }}>
                      {hostOf(siteUrl)}
                    </a>
                    <CopyButton text={siteUrl} />
                    <Link href={`${base}/qr`} className="btn btn-soft btn-sm">
                      <IQr size={16} /> {d.admin.nav.qr}
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <h2 style={{ fontSize: 24 }}>{d.setup.launchTitle}</h2>
                  <p className="muted">{d.setup.launchText}</p>
                  <div className="stack-sm">
                    <strong className="small">{d.setup.checklist}</strong>
                    {(
                      [
                        ["books", d.setup.ckBooks, true],
                        ["delivery", d.setup.ckPay, true],
                        ["contacts", d.setup.ckContacts, false],
                        ["logo", d.setup.ckLogo, false],
                        ["telegram", d.setup.ckBot, false],
                      ] as Array<[Step, string, boolean]>
                    ).map(([k, label, must]) => (
                      <button key={k} className="row" style={{ border: 0, background: "none", padding: 0, cursor: "pointer", textAlign: "left" }} onClick={() => setStep(k)}>
                        <span className={`badge ${done[k] ? "b-ok" : must ? "b-err" : ""}`} style={{ width: 26, height: 26, padding: 0, justifyContent: "center" }}>
                          {done[k] ? <ICheck size={14} /> : "·"}
                        </span>
                        <span className="small">{label}</span>
                      </button>
                    ))}
                  </div>
                  <ErrorBox error={error} />
                  <button className="btn btn-primary" onClick={launch} disabled={busy || readOnly || !done.books}>
                    {busy ? <Spinner /> : <IRocket size={18} />} {d.setup.launchBtn}
                  </button>
                  {!done.books && (
                    <Link href={`${base}/books/add`} className="btn-link small">
                      {d.setup.goBooks} →
                    </Link>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </OwnerOnly>
  );
}
