"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useApp } from "@/components/app";
import { OrderDetail } from "@/components/admin/order-detail";
import { PageHead } from "@/components/admin/shell";
import { useStore } from "@/components/admin/store";
import { IOrders, ISearch } from "@/components/icons";
import { Empty, ErrorBox, Loading, Money, OrderBadge, Pager } from "@/components/ui";
import { dateTime, prettyPhone, timeOnly } from "@/lib/format";
import { useApi, useDebounced, useInterval } from "@/lib/hooks";
import type { OrderListOut, OrderStatus, Page } from "@/lib/types";

const STATUSES: OrderStatus[] = ["new", "accepted", "shipping", "completed", "cancelled"];

function isToday(iso: string): boolean {
  const fmt = (x: Date) => x.toLocaleDateString("en-CA", { timeZone: "Asia/Tashkent" });
  return fmt(new Date(iso)) === fmt(new Date());
}

function useWide() {
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1280px)");
    const on = () => setWide(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return wide;
}

function OrdersInner() {
  const { d, lang } = useApp();
  const { id, base, orderStats, reloadStats } = useStore();
  const router = useRouter();
  const params = useSearchParams();
  const wide = useWide();
  const [status, setStatus] = useState<OrderStatus | "">((params.get("status") as OrderStatus) || "");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const dq = useDebounced(q.trim(), 350);
  const selected = Number(params.get("id")) || null;

  useEffect(() => setPage(1), [status, dq]);

  const { data, error, loading, reload } = useApi<Page<OrderListOut>>(`/tenants/${id}/orders`, {
    status: status || null,
    q: dq || null,
    page,
    size: 30,
  });
  useInterval(() => {
    reload();
    reloadStats();
  }, 20_000);

  const total = orderStats ? Object.values(orderStats.by_status).reduce((a, b) => a + b, 0) : null;

  function open(o: OrderListOut) {
    if (wide) router.replace(`${base}/orders?id=${o.id}${status ? `&status=${status}` : ""}`, { scroll: false });
    else router.push(`${base}/orders/${o.id}`);
  }

  return (
    <>
      <PageHead title={d.orders.title} sub={d.orders.autoRefresh} />
      <div className="stack" style={{ gap: 14, marginBottom: 16 }}>
        <div className="row-between">
          <div className="tabs" role="tablist">
            <button className={`tab ${status === "" ? "on" : ""}`} onClick={() => setStatus("")}>
              {d.common.all} {total !== null && <span className="n">{total}</span>}
            </button>
            {STATUSES.map((s) => (
              <button key={s} className={`tab ${status === s ? "on" : ""}`} onClick={() => setStatus(s)}>
                {d.enums.orderStatus[s]} {orderStats && <span className="n">{orderStats.by_status[s] ?? 0}</span>}
              </button>
            ))}
          </div>
          <div className="inp-wrap" style={{ minHeight: 42, maxWidth: 320, flex: "1 1 220px" }}>
            <ISearch size={18} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={d.orders.searchPh} aria-label={d.common.search} style={{ fontWeight: 500, fontSize: 15 }} />
          </div>
        </div>
      </div>
      <ErrorBox error={error} onRetry={reload} />
      <div className="orders-layout">
        <div className="stack-sm" style={{ gap: 8 }}>
          {!data && loading ? (
            <Loading />
          ) : data && data.items.length === 0 ? (
            <div className="card">
              <Empty icon={<IOrders />} title={d.orders.empty} />
            </div>
          ) : (
            data?.items.map((o) => (
              <button key={o.id} className={`orow ${selected === o.id && wide ? "sel" : ""}`} onClick={() => open(o)}>
                <span className="num">#{o.number}</span>
                <span style={{ minWidth: 0 }}>
                  <strong style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.customer_name}</strong>
                  <span className="muted xs">
                    {isToday(o.created_at) ? timeOnly(o.created_at, lang) : dateTime(o.created_at, lang)} · {d.enums.channel[o.channel]}
                  </span>
                </span>
                <span className="hide-sm small">
                  {d.enums.deliveryType[o.delivery_type]}
                  <br />
                  <span className="muted xs mono">{prettyPhone(o.customer_phone)}</span>
                </span>
                <span className="hide-sm" style={{ fontWeight: 600 }}>
                  <Money value={o.total} />
                </span>
                <span style={{ justifySelf: "end" }}>
                  <OrderBadge status={o.status} />
                </span>
              </button>
            ))
          )}
          {data && <Pager page={data.page} pages={data.pages} onPage={setPage} />}
        </div>
        {wide && (
          <aside className="panel">
            {selected ? (
              <OrderDetail key={selected} orderId={selected} onChanged={reload} />
            ) : (
              <Empty icon={<IOrders />} title={d.orders.selectOne} />
            )}
          </aside>
        )}
      </div>
    </>
  );
}

export default function OrdersPage() {
  return (
    <Suspense>
      <OrdersInner />
    </Suspense>
  );
}
