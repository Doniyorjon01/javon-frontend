"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useApp } from "@/components/app";
import { PageHead } from "@/components/admin/shell";
import { IBack, IExternal } from "@/components/icons";
import { ErrorBox, Field, Loading, Modal, Money, Spinner } from "@/components/ui";
import { ApiError, api } from "@/lib/api";
import { accessBadge, dateOnly, dateTime, groupDigits, parseSom, prettyPhone, storeUrl } from "@/lib/format";
import { fmt } from "@/lib/i18n";
import { useApi } from "@/lib/hooks";
import type { Plan, SubscriptionPaymentOut, TenantAdminDetailOut } from "@/lib/types";

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toISOString().slice(0, 10);
}

export default function StoreDetail() {
  const { d, lang, toast, confirm, config } = useApp();
  const S = d.system.stores;
  const { id } = useParams<{ id: string }>();
  const { data: t, setData, error, reload } = useApi<TenantAdminDetailOut>(`/system/tenants/${id}`);
  const [modal, setModal] = useState<"suspend" | "pay" | "sub" | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<ApiError | null>(null);
  const [reason, setReason] = useState("");
  const [pay, setPay] = useState<{ plan: Plan; months: string; amount: string; note: string }>({ plan: "start", months: "1", amount: "", note: "" });
  const [sub, setSub] = useState<{ plan: Plan; trial: string; paid: string }>({ plan: "start", trial: "", paid: "" });

  if (error) return <ErrorBox error={error} onRetry={reload} />;
  if (!t) return <Loading />;

  async function run(fn: () => Promise<unknown>, after?: () => void) {
    setBusy(true);
    setErr(null);
    try {
      await fn();
      after?.();
      setModal(null);
      reload();
    } catch (e) {
      setErr(e as ApiError);
    } finally {
      setBusy(false);
    }
  }

  async function voidPayment(p: SubscriptionPaymentOut) {
    if (!(await confirm({ title: S.voidPayment, text: S.voidConfirm, danger: true, ok: S.voidPayment }))) return;
    try {
      await api(`/system/subscription-payments/${p.id}/void`, { method: "POST" });
      reload();
    } catch (e) {
      toast((e as ApiError).readable, "err");
    }
  }

  const close = () => {
    setModal(null);
    setErr(null);
  };

  return (
    <>
      <Link href="/system/stores" className="btn-link row" style={{ gap: 6, marginBottom: 12 }}>
        <IBack size={16} /> {S.title}
      </Link>
      <PageHead title={t.name} sub={<span className="mono">{t.slug} · #{t.id}</span>}>
        {t.launched_at && (
          <a href={storeUrl(config.storeUrlTemplate, t.slug)} target="_blank" rel="noreferrer" className="btn btn-soft btn-sm">
            <IExternal size={16} /> {S.openSite}
          </a>
        )}
        {t.status === "suspended" ? (
          <button className="btn btn-success btn-sm" disabled={busy} onClick={() => run(() => api(`/system/tenants/${t.id}/activate`, { method: "POST" }))}>
            {S.activate}
          </button>
        ) : (
          <button className="btn btn-danger btn-sm" onClick={() => { setReason(""); setModal("suspend"); }}>
            {S.suspend}
          </button>
        )}
      </PageHead>
      <div className="kpis" style={{ marginBottom: 18 }}>
        <div className="kpi"><span className="l">{d.subscription.state}</span><span><span className={`badge ${accessBadge(t.access)}`}>{d.enums.access[t.access]}</span> <span className="badge">{d.enums.tenantStatus[t.status]}</span></span></div>
        <div className="kpi"><span className="v">{t.orders_30d}</span><span className="l">{S.orders30}</span></div>
        <div className="kpi"><span className="v" style={{ fontSize: 22 }}><Money value={t.sales_30d} /></span><span className="l">{S.sales30}</span></div>
        <div className="kpi"><span className="l">{S.items} / {S.staff}</span><span className="v">{t.items} / {t.staff}</span></div>
      </div>
      {t.suspended_reason && <div className="note note-err" style={{ marginBottom: 16 }}>{t.suspended_reason}</div>}
      <div className="grid-2" style={{ alignItems: "start" }}>
        <div className="card stack-sm">
          <h2>{S.owner}</h2>
          {t.owner ? (
            <>
              <strong>{t.owner.first_name} {t.owner.username && <span className="muted">@{t.owner.username}</span>}</strong>
              <span className="small mono">Telegram ID: {t.owner.telegram_id}</span>
              <span className="small">{prettyPhone(t.owner.phone)}</span>
            </>
          ) : "—"}
          <hr className="divider" />
          <span className="small">{S.bot}: {t.bot_username ? `@${t.bot_username}` : "—"} {t.bot_group_linked && <span className="badge b-ok">group</span>}</span>
          <span className="small">{S.lastOrder}: {t.last_order_at ? dateTime(t.last_order_at, lang) : "—"}</span>
          <span className="small muted">{dateOnly(t.created_at, lang)} · {t.launched_at ? `${d.stores.launched}: ${dateOnly(t.launched_at, lang)}` : d.stores.notLaunched}</span>
        </div>
        <div className="card stack-sm">
          <div className="row-between">
            <h2>{d.subscription.title}</h2>
            <button className="btn btn-soft btn-xs" onClick={() => { setSub({ plan: t.plan, trial: toLocalInput(t.trial_ends_at), paid: toLocalInput(t.paid_until) }); setModal("sub"); }}>
              {S.editSub}
            </button>
          </div>
          <span className="small">{d.subscription.plan}: <strong>{d.enums.plan[t.plan]}</strong></span>
          <span className="small">{S.trialEnds}: {dateOnly(t.trial_ends_at, lang)}</span>
          <span className="small">{S.paidUntil}: {dateOnly(t.paid_until, lang)}</span>
          <button className="btn btn-primary btn-sm" style={{ alignSelf: "flex-start", marginTop: 8 }} onClick={() => { setPay({ plan: t.plan, months: "1", amount: "", note: "" }); setModal("pay"); }}>
            {S.recordPayment}
          </button>
        </div>
      </div>
      <div className="card stack" style={{ marginTop: 16 }}>
        <h2>{d.subscription.history}</h2>
        {t.payments.length === 0 ? (
          <p className="muted">{d.subscription.noPayments}</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <tbody>
                {t.payments.map((p) => (
                  <tr key={p.id} style={{ opacity: p.is_active ? 1 : 0.5 }}>
                    <td className="mono">#{p.id}</td>
                    <td>{d.enums.plan[p.plan]}</td>
                    <td>{fmt(d.subscription.months, { n: p.months })}</td>
                    <td><Money value={p.amount} /></td>
                    <td className="small">{fmt(d.subscription.period, { from: dateOnly(p.period_start, lang), to: dateOnly(p.period_end, lang) })}</td>
                    <td className="small muted">{p.note}</td>
                    <td>
                      {p.is_active ? (
                        <button className="btn btn-danger btn-xs" onClick={() => voidPayment(p)}>{S.voidPayment}</button>
                      ) : (
                        <span className="badge">{d.subscription.void}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal === "suspend" && (
        <Modal title={S.suspend} onClose={close}>
          <Field label={S.suspendReason}>
            <textarea className="inp" minLength={3} maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)} />
          </Field>
          <ErrorBox error={err} />
          <button className="btn btn-danger" disabled={busy || reason.trim().length < 3} onClick={() => run(() => api(`/system/tenants/${t.id}/suspend`, { json: { reason: reason.trim() } }))}>
            {busy && <Spinner />} {S.suspend}
          </button>
        </Modal>
      )}
      {modal === "pay" && (
        <Modal title={S.recordPayment} onClose={close}>
          <div className="grid-2">
            <Field label={d.subscription.plan}>
              <select className="inp" value={pay.plan} onChange={(e) => setPay({ ...pay, plan: e.target.value as Plan })}>
                {(["start", "standard", "pro"] as Plan[]).map((p) => <option key={p} value={p}>{d.enums.plan[p]}</option>)}
              </select>
            </Field>
            <Field label={S.months}>
              <input className="inp" inputMode="numeric" value={pay.months} onChange={(e) => setPay({ ...pay, months: e.target.value.replace(/\D/g, "").slice(0, 2) })} />
            </Field>
          </div>
          <Field label={S.amount} hint={S.amountHint} optional>
            <input className="inp" inputMode="numeric" value={pay.amount} onChange={(e) => setPay({ ...pay, amount: groupDigits(e.target.value) })} />
          </Field>
          <Field label={S.note} optional>
            <input className="inp" maxLength={300} value={pay.note} onChange={(e) => setPay({ ...pay, note: e.target.value })} />
          </Field>
          <ErrorBox error={err} />
          <button
            className="btn btn-primary"
            disabled={busy || !Number(pay.months)}
            onClick={() =>
              run(() =>
                api(`/system/tenants/${t.id}/subscription/payments`, {
                  json: { plan: pay.plan, months: Number(pay.months), amount: pay.amount ? parseSom(pay.amount) : null, note: pay.note.trim() || null },
                }),
              )
            }
          >
            {busy && <Spinner />} {S.recordPayment}
          </button>
        </Modal>
      )}
      {modal === "sub" && (
        <Modal title={S.editSub} onClose={close}>
          <Field label={d.subscription.plan}>
            <select className="inp" value={sub.plan} onChange={(e) => setSub({ ...sub, plan: e.target.value as Plan })}>
              {(["start", "standard", "pro"] as Plan[]).map((p) => <option key={p} value={p}>{d.enums.plan[p]}</option>)}
            </select>
          </Field>
          <div className="grid-2">
            <Field label={S.trialEnds}><input className="inp" type="date" value={sub.trial} onChange={(e) => setSub({ ...sub, trial: e.target.value })} /></Field>
            <Field label={S.paidUntil}><input className="inp" type="date" value={sub.paid} onChange={(e) => setSub({ ...sub, paid: e.target.value })} /></Field>
          </div>
          <ErrorBox error={err} />
          <button
            className="btn btn-primary"
            disabled={busy}
            onClick={() =>
              run(
                async () =>
                  setData(
                    await api<TenantAdminDetailOut>(`/system/tenants/${t.id}/subscription`, {
                      method: "PATCH",
                      json: {
                        ...(sub.plan !== t.plan ? { plan: sub.plan } : {}),
                        ...(sub.trial && sub.trial !== toLocalInput(t.trial_ends_at) ? { trial_ends_at: `${sub.trial}T23:59:59+05:00` } : {}),
                        ...(sub.paid && sub.paid !== toLocalInput(t.paid_until) ? { paid_until: `${sub.paid}T23:59:59+05:00` } : {}),
                      },
                    }),
                  ),
              )
            }
          >
            {busy && <Spinner />} {d.common.save}
          </button>
        </Modal>
      )}
    </>
  );
}
