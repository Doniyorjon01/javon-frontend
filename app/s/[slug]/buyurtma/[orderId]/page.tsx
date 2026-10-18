"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useApp } from "@/components/app";
import { ICheck, ITelegram, IUpload } from "@/components/icons";
import { useShop } from "@/components/shop/shop";
import { CopyButton, ErrorBox, FilePick, Loading } from "@/components/ui";
import { ApiError, api } from "@/lib/api";
import { dateTime, money } from "@/lib/format";
import { fmt } from "@/lib/i18n";
import { useApi, useInterval } from "@/lib/hooks";
import type { OrderStatus, OrderTrackOut } from "@/lib/types";

function Track() {
  const { d, lang, toast } = useApp();
  const { slug, href, orders, inTelegram } = useShop();
  const { orderId } = useParams<{ orderId: string }>();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const isNew = params.get("new") === "1";
  const saved = orders.find((o) => String(o.id) === orderId);
  const { data: o, setData, error, reload } = useApi<OrderTrackOut>(token ? `/storefront/${slug}/orders/${orderId}` : null, { token });
  const [busy, setBusy] = useState(false);
  const final = o && (o.status === "completed" || o.status === "cancelled");
  useInterval(reload, o && !final ? 30_000 : null);

  async function sendProof(file: File) {
    setBusy(true);
    const form = new FormData();
    form.append("file", file);
    try {
      setData(await api<OrderTrackOut>(`/storefront/${slug}/orders/${orderId}/payment-proof`, { method: "POST", form, query: { token } }));
      toast(d.shop.receiptSent, "ok");
    } catch (e) {
      toast((e as ApiError).readable, "err");
    } finally {
      setBusy(false);
    }
  }

  if (!token || (error && error.status === 404)) {
    return (
      <div className="empty" style={{ paddingTop: 80 }}>
        <strong style={{ color: "var(--s-fg)" }}>{d.common.notFoundTitle}</strong>
        <Link href={href("/")} className="hbtn hbtn-o">{d.shop.toCatalog}</Link>
      </div>
    );
  }
  if (error) return <ErrorBox error={error} onRetry={reload} />;
  if (!o) return <Loading />;

  const steps: OrderStatus[] = o.delivery_type === "pickup" ? ["new", "accepted", "completed"] : ["new", "accepted", "shipping", "completed"];
  const labels: Record<string, string> = o.delivery_type === "pickup" ? d.shop.stepsPickup : d.shop.steps;
  const reached = steps.indexOf(o.status);
  const card = saved?.card_transfer;
  const needsProof = o.payment_method === "card_transfer" && o.payment_status === "unpaid" && o.status !== "cancelled";

  return (
    <div className="stack" style={{ gap: 18 }}>
      {isNew && (
        <div className="note" style={{ background: "var(--s-accent)", color: "var(--s-accent-fg)", fontSize: 16 }}>
          <ICheck size={18} style={{ verticalAlign: "-3px" }} /> {d.shop.thanks}
        </div>
      )}
      <div className="row-between">
        <h1 className="sf-h" style={{ fontSize: 32, fontWeight: 600, letterSpacing: "-0.02em" }}>{fmt(d.shop.orderTitle, { n: o.number })}</h1>
        <span className="muted small">{dateTime(o.created_at, lang)}</span>
      </div>

      {o.status === "cancelled" ? (
        <div className="note">
          <strong>{d.shop.cancelled}</strong>
          {o.cancel_reason && <div>{fmt(d.shop.cancelReason, { reason: o.cancel_reason })}</div>}
        </div>
      ) : (
        <div className="card">
          <div className="track-steps">
            {steps.map((s, i) => (
              <div key={s} className={`s ${i <= reached ? "on" : ""}`}>
                <i />
                {labels[s]}
              </div>
            ))}
          </div>
        </div>
      )}

      {o.payment_method === "card_transfer" && o.status !== "cancelled" && (
        <div className="card stack">
          {o.payment_status === "paid" ? (
            <div className="note" style={{ background: "#DDF0EC", color: "#145A50" }}>{d.shop.paid}</div>
          ) : o.payment_status === "under_review" ? (
            <div className="note">{d.shop.receiptSent}</div>
          ) : (
            <>
              <h2>{d.shop.payNow}</h2>
              {o.payment_note && <div className="note" style={{ background: "#FDECEC", color: "#8F1D22" }}>{fmt(d.shop.receiptRejected, { note: o.payment_note })}</div>}
              {card ? (
                <>
                  <p className="small">{fmt(d.shop.payInstructions, { amount: money(card.amount, lang), hours: card.hold_hours })}</p>
                  <div className="card stack-sm" style={{ background: "var(--s-head)", color: "var(--s-head-fg)", borderColor: "transparent" }}>
                    <span className="xs" style={{ opacity: 0.75 }}>{d.shop.cardNumber}</span>
                    <div className="row-between">
                      <strong className="mono" style={{ fontSize: 21, letterSpacing: ".06em" }}>{card.card_number.replace(/(\d{4})(?=\d)/g, "$1 ")}</strong>
                      <CopyButton text={card.card_number} className="hbtn hbtn-o" />
                    </div>
                    <span className="small">{d.shop.cardHolder}: {card.card_holder}</span>
                    <strong style={{ fontSize: 20 }}>{money(card.amount, lang)}</strong>
                  </div>
                </>
              ) : (
                <p className="small muted">{fmt(d.shop.payInstructions, { amount: money(o.total, lang), hours: 24 })}</p>
              )}
            </>
          )}
          {needsProof && (
            <FilePick
              accept="image/jpeg,image/png,image/webp"
              onFile={sendProof}
              busy={busy}
              className="cta-wide"
              label={
                <span className="row" style={{ gap: 8 }}>
                  <IUpload size={18} /> {d.shop.sendReceipt}
                </span>
              }
            />
          )}
        </div>
      )}

      <div className="card">
        {o.items.map((it) => (
          <div key={it.book_id} className="row-between" style={{ padding: "10px 0", borderBottom: "1px solid var(--s-line)" }}>
            <span>
              {it.title} <span className="muted">× {it.quantity}</span>
            </span>
            <span className="nowrap">{money(it.line_total, lang)}</span>
          </div>
        ))}
        {o.delivery_type === "delivery" && (
          <div className="row-between muted" style={{ padding: "10px 0" }}>
            <span>{d.shop.deliveryLine}</span>
            <span>{o.delivery_fee ? money(o.delivery_fee, lang) : d.shop.free}</span>
          </div>
        )}
        <div className="row-between" style={{ fontWeight: 700, fontSize: 19 }}>
          <span>
            {d.shop.total} · {d.enums.paymentMethod[o.payment_method].toLowerCase()}
          </span>
          <span>{money(o.total, lang)}</span>
        </div>
      </div>

      <div className="card stack-sm small">
        <span>
          <strong>{o.customer_name}</strong> · {fmt(d.shop.phoneMasked, { phone: o.phone_masked })}
        </span>
        <span>
          {d.enums.deliveryType[o.delivery_type]}
          {o.address ? ` · ${o.address}` : ""}
        </span>
      </div>

      {!inTelegram && saved?.telegram_link && !final && (
        <a href={saved.telegram_link} target="_blank" rel="noreferrer" className="hbtn hbtn-o" style={{ alignSelf: "flex-start" }}>
          <ITelegram size={18} /> {d.shop.followTelegram}
        </a>
      )}
      <p className="muted small">{d.shop.trackNote}</p>
    </div>
  );
}

export default function TrackPage() {
  return (
    <div className="container" style={{ maxWidth: 720 }}>
      <Suspense fallback={<Loading />}>
        <Track />
      </Suspense>
    </div>
  );
}
