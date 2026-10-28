"use client";

import Link from "next/link";
import { useApp } from "@/components/app";
import { useSession } from "@/components/admin/session";
import { PageHead } from "@/components/admin/shell";
import { useStore } from "@/components/admin/store";
import { IArrow, IOrders, IPlus, IQr, IScan } from "@/components/icons";
import { CopyButton, Empty, Money, OrderBadge } from "@/components/ui";
import { dateOnly, dateTime, hostOf } from "@/lib/format";
import { fmt } from "@/lib/i18n";
import { useApi } from "@/lib/hooks";
import type { InventoryItemOut, OrderListOut, Page } from "@/lib/types";

export default function StoreHome() {
  const { d, lang } = useApp();
  const { me } = useSession();
  const { id, base, tenant, orderStats, isOwner, siteUrl } = useStore();
  const recent = useApi<Page<OrderListOut>>(`/tenants/${id}/orders`, { size: 50 });
  const shelf = useApi<Page<InventoryItemOut>>(`/tenants/${id}/inventory`, { size: 1 });
  const empty = useApi<Page<InventoryItemOut>>(`/tenants/${id}/inventory`, { size: 1, in_stock: false });

  const todayKey = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Tashkent" });
  const today = recent.data?.items.filter(
    (o) => new Date(o.created_at).toLocaleDateString("en-CA", { timeZone: "Asia/Tashkent" }) === todayKey,
  ).length;

  return (
    <>
      <PageHead title={fmt(d.admin.home.hello, { name: me.user.first_name })} sub={dateOnly(new Date().toISOString(), lang)} />
      <div className="kpis" style={{ marginBottom: 22 }}>
        <Link href={`${base}/orders?status=new`} className="kpi hl lift">
          <span className="v">{orderStats?.by_status.new ?? "—"}</span>
          <span className="l">{d.admin.home.newOrders}</span>
        </Link>
        <div className="kpi">
          <span className="v">{today ?? "—"}</span>
          <span className="l">{d.admin.home.todayOrders}</span>
        </div>
        <Link href={`${base}/books`} className="kpi lift">
          <span className="v">{shelf.data?.total ?? "—"}</span>
          <span className="l">{d.admin.home.booksOnShelf}</span>
        </Link>
        <Link href={`${base}/books?filter=out`} className="kpi lift">
          <span className="v">{empty.data?.total ?? "—"}</span>
          <span className="l">{d.admin.home.outOfStock}</span>
        </Link>
      </div>

      <div className="grid-2 dash-grid" style={{ alignItems: "start" }}>
        <div className="card stack">
          <div className="row-between">
            <h2>{d.admin.home.recentOrders}</h2>
            <Link href={`${base}/orders`} className="btn-link small">
              {d.admin.home.allOrders} →
            </Link>
          </div>
          {recent.data && recent.data.items.length === 0 ? (
            <Empty icon={<IOrders />} title={d.admin.home.noOrders} />
          ) : (
            <div className="stack-sm" style={{ gap: 4 }}>
              {recent.data?.items.slice(0, 6).map((o) => (
                <Link key={o.id} href={`${base}/orders/${o.id}`} className="srow row-act" style={{ gridTemplateColumns: "56px minmax(0,1fr) auto", textDecoration: "none", color: "inherit" }}>
                  <span className="mono" style={{ fontWeight: 600 }}>#{o.number}</span>
                  <span style={{ minWidth: 0 }}>
                    <strong className="small">{o.customer_name}</strong>
                    <br />
                    <span className="muted xs">
                      {dateTime(o.created_at, lang)} · <Money value={o.total} />
                    </span>
                  </span>
                  <OrderBadge status={o.status} />
                </Link>
              ))}
            </div>
          )}
        </div>
        <div className="stack">
          {tenant.launched_at && (
            <div className="card stack-sm">
              <h2>{d.admin.home.qShare}</h2>
              <div className="row">
                <a href={siteUrl} target="_blank" rel="noreferrer" className="badge b-info mono" style={{ fontSize: 14 }}>
                  {hostOf(siteUrl)}
                </a>
                <CopyButton text={siteUrl} />
              </div>
            </div>
          )}
          <div className="card stack">
            <h2>{d.admin.home.quick}</h2>
            <div className="quick-grid">
              {isOwner && (
                <Link href={`${base}/books/add`} className="card card-tight lift row" style={{ textDecoration: "none", color: "inherit" }}>
                  <IPlus /> <strong className="grow small">{d.admin.home.qAdd}</strong> <IArrow size={16} />
                </Link>
              )}
              {isOwner && (
                <Link href={`${base}/books/add?tab=scan`} className="card card-tight lift row" style={{ textDecoration: "none", color: "inherit" }}>
                  <IScan /> <strong className="grow small">{d.admin.home.qScan}</strong> <IArrow size={16} />
                </Link>
              )}
              <Link href={`${base}/qr`} className="card card-tight lift row" style={{ textDecoration: "none", color: "inherit" }}>
                <IQr /> <strong className="grow small">{d.admin.home.qQr}</strong> <IArrow size={16} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
