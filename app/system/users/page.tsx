"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/components/app";
import { PageHead } from "@/components/admin/shell";
import { ISearch } from "@/components/icons";
import { Empty, ErrorBox, Loading, Pager } from "@/components/ui";
import { ApiError, api } from "@/lib/api";
import { dateOnly, prettyPhone } from "@/lib/format";
import { useApi, useDebounced } from "@/lib/hooks";
import type { Page, UserAdminOut } from "@/lib/types";

export default function Users() {
  const { d, lang, toast } = useApp();
  const U = d.system.users;
  const [tg, setTg] = useState("");
  const [page, setPage] = useState(1);
  const dtg = useDebounced(tg.replace(/\D/g, ""), 350);
  useEffect(() => setPage(1), [dtg]);
  const { data, setData, error, loading, reload } = useApi<Page<UserAdminOut>>("/system/users", { telegram_id: dtg || null, page, size: 30 });

  async function setMax(u: UserAdminOut, value: number) {
    try {
      const nu = await api<UserAdminOut>(`/system/users/${u.id}`, { method: "PATCH", json: { max_stores: value } });
      if (data) setData({ ...data, items: data.items.map((x) => (x.id === nu.id ? nu : x)) });
      toast(d.common.saved, "ok");
    } catch (e) {
      toast((e as ApiError).readable, "err");
    }
  }

  return (
    <>
      <PageHead title={U.title} sub={data ? `${data.total}` : undefined} />
      <div className="inp-wrap" style={{ minHeight: 42, maxWidth: 320, marginBottom: 14 }}>
        <ISearch size={18} />
        <input inputMode="numeric" value={tg} onChange={(e) => setTg(e.target.value)} placeholder={U.searchPh} style={{ fontWeight: 500, fontSize: 15 }} />
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
                <th>#</th>
                <th>{d.login.devName}</th>
                <th>Telegram</th>
                <th>{d.settings.phone}</th>
                <th>{U.maxStores}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data?.items.map((u) => (
                <tr key={u.id}>
                  <td className="mono small">{u.id}</td>
                  <td>
                    <strong>{u.first_name} {u.last_name ?? ""}</strong>
                    <br />
                    <span className="muted xs">{dateOnly(u.created_at, lang)} · {u.language}</span>
                  </td>
                  <td className="small">
                    <span className="mono">{u.telegram_id}</span>
                    {u.username && <span className="muted"> @{u.username}</span>}
                  </td>
                  <td className="small">{prettyPhone(u.phone)}</td>
                  <td>
                    <select className="inp" style={{ width: 80, minHeight: 36, padding: "4px 8px" }} value={u.max_stores} onChange={(e) => setMax(u, Number(e.target.value))} aria-label={U.maxStores}>
                      {[0, 1, 2, 3, 5, 10, 20, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </td>
                  <td>
                    {u.is_platform_admin && <span className="badge b-info">{U.admin}</span>}{" "}
                    {!u.is_active && <span className="badge b-err">{U.inactive}</span>}
                  </td>
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
