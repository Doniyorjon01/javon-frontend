"use client";

import { useApp } from "@/components/app";
import { PageHead } from "@/components/admin/shell";
import { ErrorBox, Loading, Money } from "@/components/ui";
import { useApi } from "@/lib/hooks";
import type { AccessState, PlatformMetricsOut } from "@/lib/types";

export default function Metrics() {
  const { d } = useApp();
  const { data: m, error, reload } = useApi<PlatformMetricsOut>("/system/metrics");
  const M = d.system.metrics;
  if (error) return <ErrorBox error={error} onRetry={reload} />;
  if (!m) return <Loading />;
  const tiles: Array<[string, React.ReactNode, boolean?]> = [
    [M.stores, m.stores, true],
    [M.launched, m.launched],
    [M.new7, m.new_stores_7d],
    [M.new30, m.new_stores_30d],
    [M.active7, m.active_stores_7d],
    [M.orders7, m.orders_7d],
    [M.orders30, m.orders_30d],
    [M.sales30, <Money key="s" value={m.sales_30d} />],
    [M.paying, m.paying_stores],
    [M.revenue30, <Money key="r" value={m.revenue_30d} />],
    [M.pending, m.books_pending],
    [M.jobsFailed, m.jobs_failed],
  ];
  return (
    <>
      <PageHead title={d.system.nav.metrics} />
      <div className="kpis" style={{ marginBottom: 20 }}>
        {tiles.map(([label, v, hl]) => (
          <div key={label} className={`kpi ${hl ? "hl" : ""}`}>
            <span className="v" style={{ fontSize: typeof v === "number" ? 30 : 22 }}>{v}</span>
            <span className="l">{label}</span>
          </div>
        ))}
      </div>
      <div className="card stack-sm" style={{ maxWidth: 520 }}>
        <h2>{M.byAccess}</h2>
        {Object.entries(m.by_access).map(([k, v]) => (
          <div key={k} className="row-between small">
            <span>{d.enums.access[k as AccessState] ?? k}</span>
            <strong>{v}</strong>
          </div>
        ))}
        <div className="row-between small muted">
          <span>{M.jobsQueued}</span>
          <strong>{m.jobs_queued}</strong>
        </div>
      </div>
    </>
  );
}
