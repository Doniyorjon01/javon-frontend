"use client";

import { useState } from "react";
import { useApp } from "@/components/app";
import { PageHead } from "@/components/admin/shell";
import { IRefresh } from "@/components/icons";
import { Empty, ErrorBox, Loading, Pager } from "@/components/ui";
import { ApiError, api } from "@/lib/api";
import { dateTime } from "@/lib/format";
import { useApi } from "@/lib/hooks";
import type { JobAdminOut, JobKind, JobStatus, Page } from "@/lib/types";

const KINDS: JobKind[] = ["inventory_import", "order_created", "order_status_changed", "payment_proof_received", "payment_reviewed", "owner_notice"];

export default function Jobs() {
  const { d, lang, toast } = useApp();
  const J = d.system.jobs;
  const [status, setStatus] = useState<JobStatus | "">("failed");
  const [kind, setKind] = useState<JobKind | "">("");
  const [page, setPage] = useState(1);
  const { data, error, loading, reload } = useApi<Page<JobAdminOut>>("/system/jobs", { status: status || null, kind: kind || null, page, size: 30 });

  async function retry(j: JobAdminOut) {
    try {
      await api(`/system/jobs/${j.id}/retry`, { method: "POST" });
      reload();
    } catch (e) {
      toast((e as ApiError).readable, "err");
    }
  }

  return (
    <>
      <PageHead title={J.title} />
      <div className="row" style={{ marginBottom: 14 }}>
        <div className="tabs">
          <button className={`tab ${status === "" ? "on" : ""}`} onClick={() => { setStatus(""); setPage(1); }}>{d.common.all}</button>
          {(["failed", "queued", "running", "done"] as JobStatus[]).map((s) => (
            <button key={s} className={`tab ${status === s ? "on" : ""}`} onClick={() => { setStatus(s); setPage(1); }}>{d.enums.jobStatus[s]}</button>
          ))}
        </div>
        <select className="inp" style={{ width: "auto", minHeight: 40 }} value={kind} onChange={(e) => { setKind(e.target.value as JobKind | ""); setPage(1); }} aria-label={J.kind}>
          <option value="">{J.kind}: {d.common.all}</option>
          {KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
        </select>
      </div>
      <ErrorBox error={error} onRetry={reload} />
      {!data && loading ? (
        <Loading />
      ) : data?.items.length === 0 ? (
        <div className="card"><Empty title={d.common.nothing} /></div>
      ) : (
        <div className="card table-wrap" style={{ padding: 0 }}>
          <table className="table rtable">
            <thead>
              <tr>
                <th>#</th>
                <th>{J.kind}</th>
                <th>{d.orders.status}</th>
                <th>{J.attempts}</th>
                <th>{J.lastError}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data?.items.map((j) => (
                <tr key={j.id}>
                  <td className="mono small" data-label="#">{j.id}</td>
                  <td data-label={J.kind}>
                    <span className="mono small">{j.kind}</span>
                    <br />
                    <span className="muted xs">
                      {dateTime(j.created_at, lang)}
                      {j.tenant_id && ` · store #${j.tenant_id}`}
                    </span>
                  </td>
                  <td data-label={d.orders.status}>
                    <span className={`badge ${j.status === "failed" ? "b-err" : j.status === "done" ? "b-ok" : "b-warn"}`}>{d.enums.jobStatus[j.status]}</span>
                  </td>
                  <td data-label={J.attempts}>{j.attempts} / {j.max_attempts}</td>
                  <td className="xs mono" style={{ maxWidth: 380, wordBreak: "break-word" }} data-label={J.lastError}>{j.last_error ?? "—"}</td>
                  <td>
                    {j.status === "failed" && (
                      <button className="btn btn-soft btn-xs" onClick={() => retry(j)}>
                        <IRefresh size={14} /> {J.retry}
                      </button>
                    )}
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
