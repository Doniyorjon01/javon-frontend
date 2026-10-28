"use client";

import { useState } from "react";
import { useApp } from "@/components/app";
import { BookCover } from "@/components/book-cover";
import { OwnerOnly, PageHead } from "@/components/admin/shell";
import { useStore } from "@/components/admin/store";
import { IImage } from "@/components/icons";
import { Empty, ErrorBox, FilePick, Loading, Pager } from "@/components/ui";
import { ApiError, api } from "@/lib/api";
import { dateTime, prettyIsbn } from "@/lib/format";
import { fmt } from "@/lib/i18n";
import { useApi } from "@/lib/hooks";
import type { BookOut, BookStatus, Page } from "@/lib/types";

export default function SubmissionsPage() {
  const { d, lang, toast } = useApp();
  const { id } = useStore();
  const [status, setStatus] = useState<BookStatus>("pending");
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<number | null>(null);
  const { data, setData, error, loading, reload } = useApi<Page<BookOut>>(`/tenants/${id}/catalog/submissions`, {
    status,
    page,
    size: 20,
  });

  async function uploadCover(book: BookOut, file: File) {
    setBusyId(book.id);
    const form = new FormData();
    form.append("file", file);
    try {
      const b = await api<BookOut>(`/tenants/${id}/catalog/books/${book.id}/cover`, { method: "PUT", form });
      if (data) setData({ ...data, items: data.items.map((x) => (x.id === b.id ? b : x)) });
    } catch (e) {
      toast((e as ApiError).readable, "err");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <OwnerOnly note={d.books.staffNote}>
      <PageHead title={d.submissions.title} sub={d.submissions.text} />
      <div className="tabs" style={{ marginBottom: 14 }}>
        {(
          [
            ["pending", d.submissions.tabPending],
            ["rejected", d.submissions.tabRejected],
            ["approved", d.submissions.tabApproved],
          ] as Array<[BookStatus, string]>
        ).map(([k, l]) => (
          <button
            key={k}
            className={`tab ${status === k ? "on" : ""}`}
            onClick={() => {
              setStatus(k);
              setPage(1);
            }}
          >
            {l}
          </button>
        ))}
      </div>
      <ErrorBox error={error} onRetry={reload} />
      {!data && loading ? (
        <Loading />
      ) : data?.items.length === 0 ? (
        <div className="card">
          <Empty title={d.submissions.empty} />
        </div>
      ) : (
        <div className="stack-sm" style={{ gap: 10 }}>
          {data?.items.map((b) => (
            <div key={b.id} className="inv-row row-act" style={{ gridTemplateColumns: "44px minmax(0,1fr) auto" }}>
              <BookCover title={b.title} authors={b.authors} cover={b.cover} size="s" className="bthumb" />
              <div style={{ minWidth: 0 }}>
                <strong>{b.title}</strong>
                <br />
                <span className="muted small">
                  {b.authors.map((a) => a.name).join(", ")}
                  {b.isbn13 && <span className="mono xs"> · {prettyIsbn(b.isbn13)}</span>} · {dateTime(b.created_at, lang)}
                </span>
                {b.review_note && <div className="note note-err small" style={{ marginTop: 6 }}>{fmt(d.submissions.reason, { reason: b.review_note })}</div>}
              </div>
              {b.status === "pending" && !b.cover && (
                <FilePick
                  accept="image/jpeg,image/png,image/webp"
                  busy={busyId === b.id}
                  onFile={(f) => uploadCover(b, f)}
                  label={
                    <>
                      <IImage size={16} /> {d.submissions.uploadCover}
                    </>
                  }
                />
              )}
            </div>
          ))}
        </div>
      )}
      {data && <Pager page={data.page} pages={data.pages} onPage={setPage} />}
    </OwnerOnly>
  );
}
