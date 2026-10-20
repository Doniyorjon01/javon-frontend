"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useApp } from "@/components/app";
import { useShop, type SavedOrder } from "@/components/shop/shop";
import { OrderBadge } from "@/components/ui";
import { api } from "@/lib/api";
import { dateTime, money } from "@/lib/format";
import { fmt } from "@/lib/i18n";
import type { OrderCreatedOut, OrderStatusOut } from "@/lib/types";

export default function MyOrders() {
  const { d, lang } = useApp();
  const { slug, href, orders, initData } = useShop();
  const [remote, setRemote] = useState<OrderCreatedOut[] | null>(null);
  const [statuses, setStatuses] = useState<Map<number, OrderStatusOut["status"]>>(new Map());

  // Orders saved in this browser: one request for all their statuses.
  const savedKey = orders.map((o) => `${o.id}:${o.token}`).join(",");
  useEffect(() => {
    if (orders.length === 0) return;
    const refs = orders.slice(0, 50).map((o) => ({ id: o.id, token: o.token }));
    api<OrderStatusOut[]>(`/storefront/${slug}/orders/statuses`, { method: "POST", json: { orders: refs } })
      .then((rows) => setStatuses(new Map(rows.map((r) => [r.id, r.status]))))
      .catch(() => undefined); // no status is better than no list
  }, [savedKey, slug]);

  // Inside the Mini App the backend knows this buyer's orders by Telegram account.
  useEffect(() => {
    if (!initData) return;
    api<OrderCreatedOut[]>(`/storefront/${slug}/telegram/orders`, { headers: { "X-Telegram-Init-Data": initData } })
      .then(setRemote)
      .catch(() => setRemote(null));
  }, [initData, slug]);

  const map = new Map<number, SavedOrder & { status?: OrderCreatedOut["status"] }>();
  for (const o of orders) map.set(o.id, { ...o, status: statuses.get(o.id) });
  for (const o of remote ?? []) {
    map.set(o.id, {
      ...map.get(o.id),
      id: o.id,
      number: o.number,
      token: o.tracking_token,
      created_at: o.created_at,
      total: o.total,
      card_transfer: o.card_transfer ?? map.get(o.id)?.card_transfer ?? null,
      status: o.status,
    });
  }
  const list = [...map.values()].sort((a, b) => b.created_at.localeCompare(a.created_at));

  return (
    <div className="container stack" style={{ maxWidth: 720 }}>
      <h1 className="sf-h" style={{ fontSize: 32, fontWeight: 600 }}>{d.shop.myOrders}</h1>
      {list.length === 0 ? (
        <div className="empty">
          <strong style={{ color: "var(--s-fg)" }}>{d.shop.noMyOrders}</strong>
          <Link href={href("/")} className="hbtn hbtn-f">{d.shop.toCatalog}</Link>
        </div>
      ) : (
        list.map((o) => (
          <Link
            key={o.id}
            href={`${href(`/buyurtma/${o.id}`)}?token=${encodeURIComponent(o.token)}`}
            className="card row-between"
            style={{ textDecoration: "none", color: "var(--s-fg)" }}
          >
            <span>
              <strong style={{ fontSize: 18 }}>{fmt(d.shop.orderTitle, { n: o.number })}</strong>
              <br />
              <span className="muted small">{dateTime(o.created_at, lang)}</span>
            </span>
            <span className="stack-sm" style={{ alignItems: "flex-end" }}>
              <strong>{money(o.total, lang)}</strong>
              {"status" in o && o.status && <OrderBadge status={o.status} />}
            </span>
          </Link>
        ))
      )}
    </div>
  );
}
