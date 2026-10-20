"use client";

import { useState } from "react";
import { useApp } from "@/components/app";
import { OwnerOnly, PageHead } from "@/components/admin/shell";
import { useStore } from "@/components/admin/store";
import { ErrorBox, Loading, Money } from "@/components/ui";
import { money, shortDay } from "@/lib/format";
import { fmt } from "@/lib/i18n";
import { useApi } from "@/lib/hooks";
import type { OrderChannel, OrderStatus, StoreStatsOut } from "@/lib/types";

export default function StatsPage() {
  const { d, lang } = useApp();
  const { id } = useStore();
  const [days, setDays] = useState(30);
  const { data, error, loading, reload } = useApi<StoreStatsOut>(`/tenants/${id}/stats`, { days });
  const maxDay = Math.max(1, ...(data?.by_day.map((x) => x.sales) ?? [0]));
  const maxTop = Math.max(1, ...(data?.top_books.map((x) => x.quantity) ?? [0]));

  return (
    <OwnerOnly note={d.stats.ownerOnly}>
      <PageHead title={d.stats.title}>
        <div className="seg" role="group" aria-label={d.stats.period}>
          {[7, 30, 90].map((n) => (
            <button key={n} className={days === n ? "on" : ""} onClick={() => setDays(n)}>
              {fmt(d.stats.days, { n })}
            </button>
          ))}
        </div>
      </PageHead>
      <ErrorBox error={error} onRetry={reload} />
      {!data && loading ? (
        <Loading />
      ) : data ? (
        <div className="stack" style={{ gap: 18 }}>
          <div className="kpis">
            <div className="kpi hl"><span className="v">{data.orders}</span><span className="l">{d.stats.orders}</span></div>
            <div className="kpi"><span className="v sum">{money(data.sales, lang)}</span><span className="l">{d.stats.sales}</span></div>
            <div className="kpi"><span className="v sum">{money(data.average_order, lang)}</span><span className="l">{d.stats.avg}</span></div>
            <div className="kpi"><span className="v">{data.customers}</span><span className="l">{d.stats.customers} · {fmt(d.stats.returning, {})}: {data.returning_customers}</span></div>
          </div>
          <div className="card stack">
            <div className="row-between">
              <h2>{d.stats.byDay}</h2>
              <span className="muted small">{d.stats.completedSales}: <Money value={data.completed_sales} /></span>
            </div>
            {data.orders === 0 ? (
              <p className="muted">{d.stats.noData}</p>
            ) : (
              <>
                <div className="bars" role="img" aria-label={d.stats.byDay}>
                  {data.by_day.map((x) => (
                    <div key={x.day} className="b" style={{ height: `${Math.max(1, (x.sales / maxDay) * 100)}%` }}>
                      <span className="tip">
                        {shortDay(x.day, lang)} · {x.orders} · {money(x.sales, lang)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="row-between muted xs">
                  <span>{data.by_day[0] && shortDay(data.by_day[0].day, lang)}</span>
                  <span>{data.by_day.length > 0 && shortDay(data.by_day[data.by_day.length - 1].day, lang)}</span>
                </div>
              </>
            )}
          </div>
          <div className="grid-2" style={{ alignItems: "start" }}>
            <div className="card stack">
              <h2>{d.stats.topBooks}</h2>
              {data.top_books.length === 0 ? (
                <p className="muted">{d.stats.noData}</p>
              ) : (
                data.top_books.map((b) => (
                  <div key={b.book_id} className="stack-sm" style={{ gap: 4 }}>
                    <div className="row-between small">
                      <strong>{b.title}</strong>
                      <span>
                        {b.quantity} {d.common.pcs} · <Money value={b.sales} />
                      </span>
                    </div>
                    <div className="hbar"><span style={{ width: `${(b.quantity / maxTop) * 100}%` }} /></div>
                  </div>
                ))
              )}
            </div>
            <div className="stack">
              <div className="card stack-sm">
                <h2>{d.stats.byStatus}</h2>
                {Object.entries(data.by_status).map(([k, v]) => (
                  <div key={k} className="row-between small"><span>{d.enums.orderStatus[k as OrderStatus] ?? k}</span><strong>{v}</strong></div>
                ))}
              </div>
              <div className="card stack-sm">
                <h2>{d.stats.byChannel}</h2>
                {Object.entries(data.by_channel).map(([k, v]) => (
                  <div key={k} className="row-between small"><span>{d.enums.channel[k as OrderChannel] ?? k}</span><strong>{v}</strong></div>
                ))}
              </div>
              <div className="card stack-sm">
                <h2>{d.stats.inventory}</h2>
                <div className="row-between small"><span>{d.stats.items}</span><strong>{data.inventory.items}</strong></div>
                <div className="row-between small"><span>{d.stats.visible}</span><strong>{data.inventory.visible}</strong></div>
                <div className="row-between small"><span>{d.stats.out}</span><strong>{data.inventory.out_of_stock}</strong></div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </OwnerOnly>
  );
}
