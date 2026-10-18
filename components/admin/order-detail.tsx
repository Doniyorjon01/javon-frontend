"use client";

import Link from "next/link";
import { useState } from "react";
import { ApiError, api } from "@/lib/api";
import { dateTime, prettyPhone } from "@/lib/format";
import { useApi } from "@/lib/hooks";
import { fmt } from "@/lib/i18n";
import type { OrderOut, OrderStatus } from "@/lib/types";
import { useApp } from "../app";
import { ICheck, IExternal, IPhone, IPin, IX } from "../icons";
import { ErrorBox, Field, Loading, Modal, Money, OrderBadge, PaymentBadge, Spinner } from "../ui";
import { useStore } from "./store";

// Same rules as backend database/db_order.TRANSITIONS (pickup orders skip "shipping").
const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  new: ["accepted", "cancelled"],
  accepted: ["shipping", "completed", "cancelled"],
  shipping: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export function allowedNext(o: Pick<OrderOut, "status" | "delivery_type">): OrderStatus[] {
  const list = TRANSITIONS[o.status];
  return o.delivery_type === "pickup" ? list.filter((s) => s !== "shipping") : list;
}

export function OrderDetail({ orderId, onChanged, full = false }: { orderId: number; onChanged?: () => void; full?: boolean }) {
  const { d, lang, toast } = useApp();
  const { id, base, readOnly, reloadStats } = useStore();
  const { data: order, setData, error, loading, reload } = useApi<OrderOut>(`/tenants/${id}/orders/${orderId}`);
  const [busy, setBusy] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [proofVer, setProofVer] = useState(0);

  if (error) return <ErrorBox error={error} onRetry={reload} />;
  if (!order || (loading && order.id !== orderId)) return <Loading />;

  const next = allowedNext(order);
  const cardUnpaid = order.payment_method === "card_transfer" && order.payment_status !== "paid";

  async function setStatus(status: OrderStatus, why?: string) {
    setBusy(status);
    try {
      const o = await api<OrderOut>(`/tenants/${id}/orders/${orderId}/status`, {
        json: { status, reason: why?.trim() || null },
      });
      setData(o);
      toast(d.enums.orderStatus[o.status], "ok");
      reloadStats();
      onChanged?.();
      setCancelOpen(false);
      setReason("");
    } catch (e) {
      toast((e as ApiError).readable, "err");
    } finally {
      setBusy(null);
    }
  }

  async function review(approve: boolean, note?: string) {
    setBusy(approve ? "approve" : "reject");
    try {
      const o = await api<OrderOut>(`/tenants/${id}/orders/${orderId}/payment`, {
        json: approve ? { approve: true } : { approve: false, note: note?.trim() },
      });
      setData(o);
      setProofVer((v) => v + 1);
      toast(d.enums.paymentStatus[o.payment_status], "ok");
      onChanged?.();
      setRejectOpen(false);
      setReason("");
    } catch (e) {
      toast((e as ApiError).readable, "err");
    } finally {
      setBusy(null);
    }
  }

  const stepList: OrderStatus[] =
    order.delivery_type === "pickup" ? ["new", "accepted", "completed"] : ["new", "accepted", "shipping", "completed"];
  const reached = stepList.indexOf(order.status);
  const mapUrl =
    order.latitude != null && order.longitude != null
      ? `https://yandex.uz/maps/?pt=${order.longitude},${order.latitude}&z=17&l=map`
      : null;

  const actionLabel = (s: OrderStatus) =>
    s === "accepted"
      ? d.orders.accept
      : s === "shipping"
        ? d.orders.ship
        : s === "completed"
          ? order.delivery_type === "pickup"
            ? d.orders.completePickup
            : d.orders.complete
          : d.orders.cancel;

  return (
    <div className="stack" style={{ gap: 18 }}>
      <div className="row-between" style={{ alignItems: "flex-start" }}>
        <div>
          <span className="muted small">{dateTime(order.created_at, lang)} · {d.enums.channel[order.channel]}</span>
          <h2 className="serif" style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.02em" }}>
            #{order.number}
          </h2>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <OrderBadge status={order.status} />
          {!full && (
            <Link href={`${base}/orders/${order.id}`} className="icon-btn" aria-label={d.orders.openFull} title={d.orders.openFull}>
              <IExternal size={17} />
            </Link>
          )}
        </div>
      </div>

      <div className="timeline" aria-hidden="true">
        {stepList.map((s, i) => (
          <span key={s} className={order.status === "cancelled" ? "cancel" : i <= reached ? "on" : ""} />
        ))}
      </div>
      {order.status === "cancelled" && order.cancel_reason && (
        <div className="note">{fmt(d.shop.cancelReason, { reason: order.cancel_reason })}</div>
      )}

      <div className="card card-tight stack-sm" style={{ background: "var(--paper)", borderColor: "transparent" }}>
        <div className="row-between">
          <strong style={{ fontSize: 17 }}>{order.customer_name}</strong>
          <a href={`tel:${order.customer_phone}`} className="btn btn-soft btn-xs">
            <IPhone size={15} /> {d.orders.call}
          </a>
        </div>
        <span className="mono small">{prettyPhone(order.customer_phone)}</span>
        <div className="row" style={{ gap: 8, alignItems: "flex-start" }}>
          <IPin size={17} style={{ marginTop: 3, flexShrink: 0 }} />
          <span className="grow small">
            <strong>{d.enums.deliveryType[order.delivery_type]}</strong>
            {order.delivery_type === "delivery" ? ` · ${order.address ?? ""}` : ` · ${d.orders.pickupFromStore}`}
          </span>
          {mapUrl && (
            <a href={mapUrl} target="_blank" rel="noreferrer" className="btn-link small">
              {d.orders.onMap}
            </a>
          )}
        </div>
        {order.comment && (
          <p className="small">
            <span className="muted">{d.orders.comment}: </span>
            {order.comment}
          </p>
        )}
      </div>

      <div>
        {order.items.map((it) => (
          <div key={it.book_id} className="line-item">
            <span>
              {it.title} <span className="muted">× {it.quantity}</span>
            </span>
            <Money value={it.line_total} />
          </div>
        ))}
        <div className="line-item muted">
          <span>{d.orders.deliveryFee}</span>
          <Money value={order.delivery_fee} />
        </div>
        <div className="line-item" style={{ fontWeight: 700, fontSize: 17 }}>
          <span>
            {d.orders.grandTotal} · {d.enums.paymentMethod[order.payment_method].toLowerCase()}
          </span>
          <Money value={order.total} />
        </div>
      </div>

      {order.payment_method === "card_transfer" && (
        <div className="card card-tight stack-sm">
          <div className="row-between">
            <strong>{d.orders.payment}</strong>
            <PaymentBadge status={order.payment_status} />
          </div>
          {order.paid_at && <span className="small muted">{fmt(d.orders.paidAt, { date: dateTime(order.paid_at, lang) })}</span>}
          {order.payment_note && <span className="small">{fmt(d.orders.paymentNote, { note: order.payment_note })}</span>}
          {order.has_payment_proof ? (
            <a href={`/api/tenants/${id}/orders/${order.id}/payment-proof?v=${proofVer}`} target="_blank" rel="noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/tenants/${id}/orders/${order.id}/payment-proof?v=${proofVer}`}
                alt={d.orders.receipt}
                style={{ maxHeight: 320, borderRadius: 12, border: "1px solid var(--line)", objectFit: "contain", width: "100%", background: "#fafafa" }}
              />
            </a>
          ) : (
            <span className="small muted">{d.orders.noReceipt}</span>
          )}
          {order.payment_status === "under_review" && !readOnly && (
            <div className="row" style={{ gap: 8 }}>
              <button className="btn btn-success btn-sm" disabled={!!busy} onClick={() => review(true)}>
                {busy === "approve" ? <Spinner /> : <ICheck size={16} />} {d.orders.approve}
              </button>
              <button className="btn btn-danger btn-sm" disabled={!!busy} onClick={() => setRejectOpen(true)}>
                <IX size={16} /> {d.orders.reject}
              </button>
            </div>
          )}
        </div>
      )}

      {next.length > 0 && !readOnly && (
        <div className="stack-sm">
          {cardUnpaid && order.status !== "new" && <div className="note note-warn small">{d.orders.cardUnpaidNote}</div>}
          <div className="row" style={{ gap: 8 }}>
            {next
              .filter((s) => s !== "cancelled")
              .map((s) => (
                <button
                  key={s}
                  className="btn btn-primary"
                  disabled={!!busy || (cardUnpaid && (s === "shipping" || s === "completed"))}
                  onClick={() => setStatus(s)}
                >
                  {busy === s && <Spinner />} {actionLabel(s)}
                </button>
              ))}
            {next.includes("cancelled") && (
              <button className="btn btn-danger" disabled={!!busy} onClick={() => setCancelOpen(true)}>
                {d.orders.cancel}
              </button>
            )}
          </div>
          <span className="muted xs">{d.orders.notifyNote}</span>
        </div>
      )}

      {cancelOpen && (
        <Modal title={d.orders.cancelTitle} onClose={() => setCancelOpen(false)}>
          <Field label={d.orders.cancelReason} hint={d.orders.cancelNote} optional>
            <textarea className="inp" maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)} placeholder={d.orders.cancelReasonPh} />
          </Field>
          <div className="row" style={{ justifyContent: "flex-end" }}>
            <button className="btn btn-soft btn-sm" onClick={() => setCancelOpen(false)}>{d.common.close}</button>
            <button className="btn btn-danger btn-sm" disabled={!!busy} onClick={() => setStatus("cancelled", reason)}>
              {busy === "cancelled" && <Spinner />} {d.orders.cancel}
            </button>
          </div>
        </Modal>
      )}
      {rejectOpen && (
        <Modal title={d.orders.rejectTitle} onClose={() => setRejectOpen(false)}>
          <Field label={d.orders.rejectNote}>
            <textarea className="inp" minLength={3} maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)} placeholder={d.orders.rejectNotePh} />
          </Field>
          <div className="row" style={{ justifyContent: "flex-end" }}>
            <button className="btn btn-soft btn-sm" onClick={() => setRejectOpen(false)}>{d.common.close}</button>
            <button className="btn btn-danger btn-sm" disabled={!!busy || reason.trim().length < 3} onClick={() => review(false, reason)}>
              {busy === "reject" && <Spinner />} {d.orders.reject}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
