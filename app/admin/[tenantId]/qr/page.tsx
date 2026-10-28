"use client";

import { useState } from "react";
import { useApp } from "@/components/app";
import { BookCover } from "@/components/book-cover";
import { PageHead } from "@/components/admin/shell";
import { useStore } from "@/components/admin/store";
import { IDownload, IMinus, IPlus, ISearch } from "@/components/icons";
import { CopyButton, ErrorBox, Loading, Money, Pager } from "@/components/ui";
import { hostOf } from "@/lib/format";
import { fmt } from "@/lib/i18n";
import { useApi, useDebounced } from "@/lib/hooks";
import type { InventoryItemOut, Page } from "@/lib/types";

export default function QrPage() {
  const { d } = useApp();
  const { id, tenant, siteUrl } = useStore();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const dq = useDebounced(q.trim(), 350);
  const [picked, setPicked] = useState<Record<number, number>>({});
  const items = useApi<Page<InventoryItemOut>>(`/tenants/${id}/inventory`, { q: dq || null, page, size: 20, in_stock: true });

  const ids = Object.entries(picked).flatMap(([itemId, n]) => Array(n).fill(itemId));
  const count = ids.length;
  const bump = (itemId: number, delta: number) =>
    setPicked((p) => {
      const n = Math.max(0, Math.min(24, (p[itemId] ?? 0) + delta));
      const next = { ...p };
      if (n) next[itemId] = n;
      else delete next[itemId];
      return next;
    });

  return (
    <>
      <PageHead title={d.qr.title} sub={d.qr.text} />
      {!tenant.launched_at && <div className="note note-warn" style={{ marginBottom: 16 }}>{d.qr.noLaunch}</div>}
      <div className="grid-2" style={{ alignItems: "start" }}>
        <div className="card stack" style={{ alignItems: "center", textAlign: "center" }}>
          <h2>{d.qr.storeQr}</h2>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/api/tenants/${id}/qr/store?format=svg`} alt={d.qr.storeQr} width={220} height={220} style={{ background: "#fff", borderRadius: 16, padding: 10, border: "1px solid var(--line)" }} />
          <div className="row" style={{ justifyContent: "center" }}>
            <span className="badge b-info mono">{hostOf(siteUrl)}</span>
            <CopyButton text={siteUrl} className="btn btn-soft btn-xs" />
          </div>
          <div className="row" style={{ justifyContent: "center" }}>
            <a className="btn btn-soft btn-sm" href={`/api/tenants/${id}/qr/store?format=svg`} download={`${tenant.slug}-qr.svg`}>
              <IDownload size={16} /> {d.qr.svg}
            </a>
            <a className="btn btn-soft btn-sm" href={`/api/tenants/${id}/qr/store?format=png`} download={`${tenant.slug}-qr.png`}>
              <IDownload size={16} /> {d.qr.png}
            </a>
            <a className="btn btn-ink btn-sm" href={`/api/tenants/${id}/qr/poster.pdf`} target="_blank" rel="noreferrer">
              <IDownload size={16} /> {d.qr.poster}
            </a>
          </div>
        </div>
        <div className="card stack">
          <div>
            <h2>{d.qr.labels}</h2>
            <p className="muted small">{d.qr.labelsText}</p>
          </div>
          <div className="inp-wrap" style={{ minHeight: 42 }}>
            <ISearch size={18} />
            <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder={d.books.searchPh} style={{ fontWeight: 500, fontSize: 15 }} />
          </div>
          <ErrorBox error={items.error} onRetry={items.reload} />
          {!items.data && items.loading ? (
            <Loading />
          ) : (
            <div className="stack-sm" style={{ gap: 2 }}>
              {items.data?.items.map((it) => (
                <div key={it.id} className="srow" style={{ gridTemplateColumns: "44px minmax(0,1fr) auto" }}>
                  <BookCover title={it.book.title} authors={it.book.authors} cover={it.book.cover} size="s" className="bthumb" />
                  <span style={{ minWidth: 0 }}>
                    <strong className="small clamp-2">{it.book.title}</strong>
                    <br />
                    <span className="muted xs"><Money value={it.price} /></span>
                  </span>
                  <span className="qty">
                    <button type="button" disabled={!picked[it.id]} onClick={() => bump(it.id, -1)} aria-label="-1"><IMinus size={14} /></button>
                    <span style={{ minWidth: 24, textAlign: "center", fontWeight: 600 }}>{picked[it.id] ?? 0}</span>
                    <button type="button" onClick={() => bump(it.id, 1)} aria-label="+1"><IPlus size={14} /></button>
                  </span>
                </div>
              ))}
            </div>
          )}
          {items.data && <Pager page={items.data.page} pages={items.data.pages} onPage={setPage} />}
          <div className="row-between" style={{ borderTop: "1px solid var(--line)", paddingTop: 14 }}>
            <span className="small">{fmt(d.qr.selected, { n: count })}</span>
            <a
              className="btn btn-primary btn-sm"
              aria-disabled={count === 0}
              href={count ? `/api/tenants/${id}/qr/labels.pdf?items=${ids.join(",")}` : undefined}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => count === 0 && e.preventDefault()}
            >
              <IDownload size={16} /> {d.qr.labelsBtn}
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
