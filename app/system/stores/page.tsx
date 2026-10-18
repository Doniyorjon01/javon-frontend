"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useApp } from "@/components/app";
import { PageHead } from "@/components/admin/shell";
import { ISearch } from "@/components/icons";
import { Empty, ErrorBox, Loading, Money, Pager } from "@/components/ui";
import { accessBadge, dateOnly, dateTime } from "@/lib/format";
import { useApi, useDebounced } from "@/lib/hooks";
import type { Page, TenantAdminOut, TenantStatus } from "@/lib/types";

export default function Stores() {
  const { d, lang } = useApp();
  const S = d.system.stores;
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<TenantStatus | "">("");
  const [closed, setClosed] = useState(false);
  const [page, setPage] = useState(1);
  const dq = useDebounced(q.trim(), 350);
  useEffect(() => setPage(1), [dq, status, closed]);
  const { data, error, loading, reload } = useApi<Page<TenantAdminOut>>("/system/tenants", {
    q: dq || null,
    status: status || null,
    closed: closed ? true : null,
    page,
    size: 25,
  });
  return (
    <>
      <PageHead title={S.title} sub={data ? `${data.total}` : undefined} />
      <div className="row" style={{ marginBottom: 14 }}>
        <div className="inp-wrap" style={{ minHeight: 42, flex: "1 1 240px", maxWidth: 340 }}>
          <ISearch size={18} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={S.searchPh} style={{ fontWeight: 500, fontSize: 15 }} />
        </div>
        <select className="inp" style={{ width: "auto", minHeight: 42 }} value={status} onChange={(e) => setStatus(e.target.value as TenantStatus | "")}>
          <option value="">{d.common.all}</option>
          {(["trial", "active", "suspended"] as TenantStatus[]).map((s) => <option key={s} value={s}>{d.enums.tenantStatus[s]}</option>)}
        </select>
        <label className="check"><input type="checkbox" checked={closed} onChange={(e) => setClosed(e.target.checked)} /> {S.closed}</label>
      </div>
      <ErrorBox error={error} onRetry={reload} />
      {!data && loading ? (
        <Loading />
      ) : data?.items.length === 0 ? (
        <div className="card"><Empty title={d.common.nothing} /></div>
      ) : (
        <div className="card table-wrap" style={{ padding: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>{d.settings.name}</th>
                <th>{S.owner}</th>
                <th>{d.subscription.plan}</th>
                <th>{d.subscription.state}</th>
                <th>{S.orders30}</th>
                <th>{S.sales30}</th>
                <th>{S.lastOrder}</th>
              </tr>
            </thead>
            <tbody>
              {data?.items.map((t) => (
                <tr key={t.id}>
                  <td>
                    <Link href={`/system/stores/${t.id}`} style={{ fontWeight: 600 }}>{t.name}</Link>
                    <br />
                    <span className="mono xs muted">{t.slug} · {dateOnly(t.created_at, lang)}</span>
                  </td>
                  <td className="small">
                    {t.owner ? (
                      <>
                        {t.owner.first_name}
                        {t.owner.username && <span className="muted"> @{t.owner.username}</span>}
                      </>
                    ) : "—"}
                  </td>
                  <td>{d.enums.plan[t.plan]}</td>
                  <td><span className={`badge ${accessBadge(t.access)}`}>{d.enums.access[t.access]}</span>{!t.launched_at && <span className="badge" style={{ marginLeft: 4 }}>{d.stores.notLaunched}</span>}</td>
                  <td>{t.orders_30d}</td>
                  <td><Money value={t.sales_30d} /></td>
                  <td className="small">{t.last_order_at ? dateTime(t.last_order_at, lang) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {data && <Pager page={data.page} pages={data.pages} onPage={setPage} />}
    </>
  );
}
