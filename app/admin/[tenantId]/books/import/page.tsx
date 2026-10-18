"use client";

import { useState } from "react";
import { useApp } from "@/components/app";
import { OwnerOnly, PageHead } from "@/components/admin/shell";
import { useStore } from "@/components/admin/store";
import { IDownload, IUpload } from "@/components/icons";
import { Empty, ErrorBox, FilePick, Loading, Pager } from "@/components/ui";
import { ApiError, api } from "@/lib/api";
import { dateTime } from "@/lib/format";
import { fmt } from "@/lib/i18n";
import { useApi, useInterval } from "@/lib/hooks";
import type { InventoryImportOut, Page } from "@/lib/types";

type Report = {
  books_matched?: number;
  books_created?: number;
  items_added?: number;
  items_updated?: number;
  failed_rows?: number;
  errors?: Array<{ line: number; code: string; message: string }>;
  errors_truncated?: boolean;
  error?: string;
};

export default function ImportPage() {
  const { d, lang, toast } = useApp();
  const { id, readOnly } = useStore();
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const list = useApi<Page<InventoryImportOut>>(`/tenants/${id}/inventory/imports`, { page, size: 10 });
  const active = list.data?.items.some((x) => x.status === "queued" || x.status === "running");
  useInterval(list.reload, active ? 2500 : null);

  async function upload(file: File) {
    setBusy(true);
    setError(null);
    const form = new FormData();
    form.append("file", file);
    try {
      await api<InventoryImportOut>(`/tenants/${id}/inventory/imports`, { method: "POST", form });
      toast(file.name, "ok");
      setPage(1);
      list.reload();
    } catch (e) {
      setError(e as ApiError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <OwnerOnly note={d.books.staffNote}>
      <PageHead title={d.imports.title} />
      <div className="stack" style={{ maxWidth: 860 }}>
        <div className="card stack">
          <p>{d.imports.text}</p>
          <p className="muted small">{d.imports.columns}</p>
          <div className="row">
            <a className="btn btn-soft btn-sm" href={`/api/tenants/${id}/inventory/import-template`} download>
              <IDownload size={16} /> {d.imports.template}
            </a>
            <FilePick
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onFile={upload}
              busy={busy || readOnly}
              className="btn btn-primary btn-sm"
              label={
                <>
                  <IUpload size={16} /> {d.imports.choose}
                </>
              }
            />
          </div>
          {error && (error.code === "plan_feature_unavailable" ? <div className="note note-warn">{d.imports.planNo}</div> : <ErrorBox error={error} />)}
        </div>

        <div className="card stack">
          <h2>{d.imports.history}</h2>
          <ErrorBox error={list.error} onRetry={list.reload} />
          {!list.data && list.loading ? (
            <Loading />
          ) : list.data?.items.length === 0 ? (
            <Empty title={d.imports.empty} />
          ) : (
            list.data?.items.map((imp) => {
              const r = (imp.report ?? {}) as Report;
              const pct = imp.total_rows ? Math.round((imp.processed_rows / imp.total_rows) * 100) : 0;
              return (
                <div key={imp.id} className="card card-tight stack-sm" style={{ background: "var(--paper)", borderColor: "transparent" }}>
                  <div className="row-between">
                    <strong>{imp.file_name}</strong>
                    <span className={`badge ${imp.status === "done" ? "b-ok" : imp.status === "failed" ? "b-err" : "b-warn"}`}>
                      {d.enums.importStatus[imp.status]}
                    </span>
                  </div>
                  <span className="muted xs">{dateTime(imp.created_at, lang)}</span>
                  {(imp.status === "running" || imp.status === "queued") && (
                    <>
                      <div className="hbar"><span style={{ width: `${pct}%` }} /></div>
                      <span className="small">{fmt(d.imports.rows, { done: imp.processed_rows, total: imp.total_rows })}</span>
                    </>
                  )}
                  {imp.status === "done" && (
                    <div className="row small" style={{ gap: 14 }}>
                      <span>{fmt(d.imports.added, { n: r.items_added ?? 0 })}</span>
                      <span>{fmt(d.imports.updated, { n: r.items_updated ?? 0 })}</span>
                      <span>{fmt(d.imports.matched, { n: r.books_matched ?? 0 })}</span>
                      <span>{fmt(d.imports.created, { n: r.books_created ?? 0 })}</span>
                      {!!r.failed_rows && <span style={{ color: "#b4232a" }}>{fmt(d.imports.failed, { n: r.failed_rows })}</span>}
                    </div>
                  )}
                  {imp.status === "failed" && r.error && <div className="note note-err small">{r.error}</div>}
                  {r.errors && r.errors.length > 0 && (
                    <details>
                      <summary className="btn-link small">{fmt(d.imports.failed, { n: r.failed_rows ?? r.errors.length })}</summary>
                      <div className="stack-sm small" style={{ marginTop: 8 }}>
                        {r.errors.map((e, i) => (
                          <span key={i}>
                            <span className="mono">{fmt(d.imports.line, { line: e.line })}</span>: {e.message}
                          </span>
                        ))}
                        {r.errors_truncated && <span className="muted">{d.imports.truncated}</span>}
                      </div>
                    </details>
                  )}
                </div>
              );
            })
          )}
          {list.data && <Pager page={list.data.page} pages={list.data.pages} onPage={setPage} />}
        </div>
      </div>
    </OwnerOnly>
  );
}
