"use client";

import { useApp } from "@/components/app";
import { OwnerOnly, PageHead } from "@/components/admin/shell";
import { useStore } from "@/components/admin/store";
import { ICheck } from "@/components/icons";
import { CopyButton, ErrorBox, Loading, Money } from "@/components/ui";
import { dateOnly } from "@/lib/format";
import { fmt } from "@/lib/i18n";
import { useApi } from "@/lib/hooks";
import type { SubscriptionOut } from "@/lib/types";

export default function SubscriptionPage() {
  const { d, lang } = useApp();
  const { id } = useStore();
  const { data: s, error, loading, reload } = useApi<SubscriptionOut>(`/tenants/${id}/subscription`);
  const stateCls = s ? (s.state === "active" || s.state === "trial" ? "b-ok" : s.state === "grace" ? "b-warn" : "b-err") : "";

  return (
    <OwnerOnly note={d.settings.ownerOnly}>
      <PageHead title={d.subscription.title} />
      <ErrorBox error={error} onRetry={reload} />
      {!s && loading ? (
        <Loading />
      ) : s ? (
        <div className="stack" style={{ maxWidth: 1100 }}>
          <div className="kpis">
            <div className="kpi">
              <span className="l">{d.subscription.state}</span>
              <span><span className={`badge ${stateCls}`} style={{ fontSize: 15 }}>{d.enums.access[s.state]}</span></span>
            </div>
            <div className="kpi">
              <span className="l">{d.subscription.plan}</span>
              <span className="v">{d.enums.plan[s.plan]}</span>
            </div>
            <div className="kpi">
              <span className="l">{d.subscription.accessUntil}</span>
              <span className="v" style={{ fontSize: 20 }}>{dateOnly(s.access_until, lang)}</span>
            </div>
            <div className="kpi">
              <span className="l">{d.subscription.usage}</span>
              <span className="small">
                {d.subscription.books}: <strong>{s.items_used} / {s.item_limit ?? d.subscription.unlimited}</strong>
                <br />
                {d.subscription.staff}: <strong>{s.staff_used} / {s.staff_limit}</strong>
              </span>
            </div>
          </div>
          {s.suspended_reason && <div className="note note-err">{s.suspended_reason}</div>}
          <div className="grid-2" style={{ alignItems: "start" }}>
            <div className="card stack">
              <h2>{d.subscription.howToPay}</h2>
              <p className="muted small">{d.subscription.payText}</p>
              {s.pay_to.card_number ? (
                <div className="card card-tight stack-sm" style={{ background: "var(--ink)", color: "var(--paper)", borderColor: "var(--ink)" }}>
                  <span className="xs" style={{ opacity: 0.7 }}>{d.subscription.payCard}</span>
                  <div className="row-between">
                    <strong className="mono" style={{ fontSize: 20, letterSpacing: ".06em" }}>{s.pay_to.card_number.replace(/(\d{4})(?=\d)/g, "$1 ")}</strong>
                    <CopyButton text={s.pay_to.card_number} className="btn btn-saffron btn-xs" />
                  </div>
                  {s.pay_to.card_holder && <span className="small">{d.subscription.payHolder}: {s.pay_to.card_holder}</span>}
                </div>
              ) : (
                <div className="note note-warn small">{d.subscription.payNotSet}</div>
              )}
              {s.pay_to.support_telegram && (
                <a href={`https://t.me/${s.pay_to.support_telegram}`} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm" style={{ alignSelf: "flex-start" }}>
                  {fmt(d.subscription.paySupport, { username: s.pay_to.support_telegram })}
                </a>
              )}
              <div className="stack-sm small muted">
                {s.trial_ends_at && <span>{d.subscription.trialEnds}: {dateOnly(s.trial_ends_at, lang)}</span>}
                {s.paid_until && <span>{d.subscription.paidUntil}: {dateOnly(s.paid_until, lang)}</span>}
                {s.closes_at && <span>{d.subscription.closesAt}: {dateOnly(s.closes_at, lang)}</span>}
              </div>
            </div>
            <div className="card stack">
              <h2>{d.subscription.plans}</h2>
              {s.plans.map((p) => (
                <div key={p.plan} className="card card-tight row-between" style={{ borderColor: p.plan === s.plan ? "var(--cobalt)" : undefined, borderWidth: p.plan === s.plan ? 2 : undefined }}>
                  <div>
                    <strong style={{ fontSize: 17 }}>{d.enums.plan[p.plan]}</strong>
                    {p.plan === s.plan && <span className="badge b-info" style={{ marginLeft: 8 }}>{d.subscription.current}</span>}
                    <br />
                    <span className="muted xs">
                      {p.item_limit ? fmt(d.landing.upToBooks, { n: p.item_limit }) : d.landing.unlimitedBooks} · {fmt(d.landing.staffLimit, { n: p.staff_limit })}
                      {p.excel_import && <> · <ICheck size={12} /> Excel</>}
                    </span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <strong><Money value={p.monthly_price} /></strong>
                    <span className="muted xs"> {d.common.perMonth}</span>
                    <br />
                    <span className="muted xs"><Money value={p.yearly_price} /> {d.landing.perYear}</span>
                  </div>
                </div>
              ))}
              <span className="muted xs">{d.subscription.yearlyNote}</span>
            </div>
          </div>
          <div className="card stack">
            <h2>{d.subscription.history}</h2>
            {s.payments.length === 0 ? (
              <p className="muted">{d.subscription.noPayments}</p>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <tbody>
                    {s.payments.map((p) => (
                      <tr key={p.id} style={{ opacity: p.is_active ? 1 : 0.5 }}>
                        <td>{d.enums.plan[p.plan]}</td>
                        <td>{fmt(d.subscription.months, { n: p.months })}</td>
                        <td><Money value={p.amount} /></td>
                        <td className="small">{fmt(d.subscription.period, { from: dateOnly(p.period_start, lang), to: dateOnly(p.period_end, lang) })}</td>
                        <td>{!p.is_active && <span className="badge">{d.subscription.void}</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </OwnerOnly>
  );
}
