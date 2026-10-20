"use client";

import { useEffect, useState } from "react";
import { ApiError, api } from "@/lib/api";
import { currency, groupDigits, parseSom, prettyIsbn } from "@/lib/format";
import { fmt } from "@/lib/i18n";
import type { InventoryItemOut } from "@/lib/types";
import { useApp } from "../app";
import { BookCover } from "../book-cover";
import { IMinus, IPlus, IQr, ITrash } from "../icons";
import { Switch } from "../ui";
import { useStore } from "./store";

export function InventoryRow({
  item,
  onChange,
  onRemoved,
}: {
  item: InventoryItemOut;
  onChange: (i: InventoryItemOut) => void;
  onRemoved: (id: number) => void;
}) {
  const { d, lang, toast, confirm } = useApp();
  const { id, isOwner, readOnly } = useStore();
  const [price, setPrice] = useState(groupDigits(String(Math.round(item.price / 100))));
  const [qty, setQty] = useState(String(item.quantity));
  const [busy, setBusy] = useState(false);

  useEffect(() => setPrice(groupDigits(String(Math.round(item.price / 100)))), [item.price]);
  useEffect(() => setQty(String(item.quantity)), [item.quantity]);

  async function run(fn: () => Promise<InventoryItemOut>) {
    setBusy(true);
    try {
      onChange(await fn());
    } catch (e) {
      toast((e as ApiError).readable, "err");
      setPrice(groupDigits(String(Math.round(item.price / 100))));
      setQty(String(item.quantity));
    } finally {
      setBusy(false);
    }
  }

  const savePrice = () => {
    const tiyin = parseSom(price);
    if (tiyin === 0) toast(d.add.pricePositive, "err");
    if (tiyin === null || tiyin <= 0 || tiyin === item.price) {
      setPrice(groupDigits(String(Math.round(item.price / 100))));
      return;
    }
    void run(() => api(`/tenants/${id}/inventory/${item.id}`, { method: "PATCH", json: { price: tiyin } }));
  };
  // Relative change: never loses a sale that happened meanwhile (backend /adjust).
  const adjust = (delta: number) => {
    if (!delta) return;
    void run(() => api(`/tenants/${id}/inventory/${item.id}/adjust`, { json: { delta } }));
  };
  const saveQty = () => {
    const n = parseInt(qty, 10);
    if (!Number.isFinite(n) || n < 0) return setQty(String(item.quantity));
    adjust(n - item.quantity);
  };

  async function remove() {
    const ok = await confirm({
      title: d.common.areYouSure,
      text: fmt(d.books.removeConfirm, { title: item.book.title }),
      ok: d.common.yesDelete,
      danger: true,
    });
    if (!ok) return;
    try {
      await api(`/tenants/${id}/inventory/${item.id}`, { method: "DELETE" });
      onRemoved(item.id);
    } catch (e) {
      toast((e as ApiError).readable, "err");
    }
  }

  const b = item.book;
  return (
    <div className="inv-row" style={{ opacity: busy ? 0.7 : 1 }}>
      <BookCover title={b.title} authors={b.authors} cover={b.cover} size="s" className="bthumb" />
      <div style={{ minWidth: 0 }}>
        <strong style={{ display: "block" }}>{b.title}</strong>
        <span className="muted small">
          {b.authors.map((a) => a.name).join(", ")}
          {b.isbn13 && <span className="mono xs"> · {prettyIsbn(b.isbn13)}</span>}
        </span>
        <div className="row" style={{ gap: 6, marginTop: 4 }}>
          {item.quantity === 0 ? <span className="badge b-cancelled">{d.books.outOfStock}</span> : <span className="badge b-ok">{d.books.inStock}</span>}
          {!item.is_visible && <span className="badge">{d.books.hidden}</span>}
          {b.status !== "approved" && <span className={`badge ${b.status === "rejected" ? "b-err" : "b-warn"}`}>{d.enums.bookStatus[b.status]}</span>}
        </div>
      </div>
      <div className="inv-controls">
        <label className="field" style={{ fontWeight: 500 }}>
          <span className="xs muted">{d.books.price}</span>
          <span className="price-inp">
            <input
              inputMode="numeric"
              value={price}
              disabled={!isOwner || readOnly}
              onChange={(e) => setPrice(groupDigits(e.target.value))}
              onBlur={savePrice}
              onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
              aria-label={d.books.price}
            />
            <span>{currency(lang)}</span>
          </span>
        </label>
        <label className="field" style={{ fontWeight: 500 }}>
          <span className="xs muted">{d.books.quantity}</span>
          <span className="qty">
            <button type="button" disabled={readOnly || item.quantity <= 0} onClick={() => adjust(-1)} aria-label="-1">
              <IMinus size={15} />
            </button>
            <input
              inputMode="numeric"
              value={qty}
              disabled={readOnly}
              onChange={(e) => setQty(e.target.value.replace(/\D/g, ""))}
              onBlur={saveQty}
              onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
              aria-label={d.books.quantity}
            />
            <button type="button" disabled={readOnly} onClick={() => adjust(1)} aria-label="+1">
              <IPlus size={15} />
            </button>
          </span>
        </label>
        <label className="field" style={{ fontWeight: 500, alignItems: "flex-start" }}>
          <span className="xs muted">{d.books.visible}</span>
          <Switch
            checked={item.is_visible}
            disabled={!isOwner || readOnly}
            label={d.books.visible}
            onChange={(v) => void run(() => api(`/tenants/${id}/inventory/${item.id}`, { method: "PATCH", json: { is_visible: v } }))}
          />
        </label>
        <div className="row" style={{ gap: 6, justifyContent: "flex-end" }}>
          <a className="icon-btn" href={`/api/tenants/${id}/qr/items/${item.id}?format=png`} download title={d.books.qr} aria-label={d.books.qr}>
            <IQr size={17} />
          </a>
          {isOwner && !readOnly && (
            <button className="icon-btn" onClick={remove} title={d.common.delete} aria-label={d.common.delete}>
              <ITrash size={17} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
