"use client";

import { useState } from "react";
import { useApp } from "@/components/app";
import { BookCover } from "@/components/book-cover";
import { PageHead } from "@/components/admin/shell";
import { ICheck, IImage, ITrash, IX } from "@/components/icons";
import { Empty, ErrorBox, Field, FilePick, Loading, Modal, Pager, Spinner } from "@/components/ui";
import { ApiError, api } from "@/lib/api";
import { dateTime, prettyIsbn } from "@/lib/format";
import { useApi } from "@/lib/hooks";
import type { BookLanguage, BookOut, BookScript, BookStatus, BookUpdate, Page } from "@/lib/types";

export default function Moderation() {
  const { d, lang, toast } = useApp();
  const [status, setStatus] = useState<BookStatus>("pending");
  const [page, setPage] = useState(1);
  const { data, setData, error, loading, reload } = useApi<Page<BookOut>>("/system/catalog/books", { status, page, size: 20 });
  const [editing, setEditing] = useState<BookOut | null>(null);
  const [rejecting, setRejecting] = useState<BookOut | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const C = d.system.catalog;

  const put = (b: BookOut) => data && setData({ ...data, items: data.items.map((x) => (x.id === b.id ? b : x)) });
  const drop = (id: number) => data && setData({ ...data, items: data.items.filter((x) => x.id !== id), total: data.total - 1 });

  async function act(key: string, fn: () => Promise<BookOut>, removeFromList: boolean) {
    setBusy(key);
    try {
      const b = await fn();
      if (removeFromList && b.status !== status) drop(b.id);
      else put(b);
      return true;
    } catch (e) {
      toast((e as ApiError).readable, "err");
      return false;
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <PageHead title={C.title} sub={data ? `${data.total}` : undefined} />
      <div className="tabs" style={{ marginBottom: 14 }}>
        {(["pending", "approved", "rejected"] as BookStatus[]).map((s) => (
          <button key={s} className={`tab ${status === s ? "on" : ""}`} onClick={() => { setStatus(s); setPage(1); }}>
            {d.enums.bookStatus[s]}
          </button>
        ))}
      </div>
      <ErrorBox error={error} onRetry={reload} />
      {!data && loading ? (
        <Loading />
      ) : data?.items.length === 0 ? (
        <div className="card"><Empty title={d.common.nothing} /></div>
      ) : (
        <div className="stack-sm" style={{ gap: 10 }}>
          {data?.items.map((b) => (
            <div key={b.id} className="card card-tight mod-card">
              <BookCover title={b.title} authors={b.authors} cover={b.cover} size="s" style={{ width: 64, fontSize: 8 }} />
              <div className="grow stack-sm" style={{ gap: 4 }}>
                <strong style={{ fontSize: 17 }}>{b.title}{b.subtitle ? `: ${b.subtitle}` : ""}</strong>
                <span className="small muted">
                  {b.authors.map((a) => a.name).join(", ")}
                  {b.publisher && ` · ${b.publisher.name}`} · {d.enums.bookLanguage[b.language]} · {d.enums.bookScript[b.script]}
                  {b.published_year && ` · ${b.published_year}`}
                </span>
                <span className="xs muted mono">
                  #{b.id} {b.isbn13 && `· ISBN ${prettyIsbn(b.isbn13)}`} {b.mxik_code && `· MXIK ${b.mxik_code}`} · {dateTime(b.created_at, lang)}
                </span>
                {b.description && <p className="small" style={{ maxWidth: 760 }}>{b.description.slice(0, 300)}{b.description.length > 300 ? "…" : ""}</p>}
                {b.review_note && <span className="note note-err small">{b.review_note}</span>}
                <div className="row" style={{ gap: 8, marginTop: 6 }}>
                  {b.status !== "approved" && (
                    <button className="btn btn-success btn-xs" disabled={!!busy} onClick={() => act(`a${b.id}`, () => api(`/system/catalog/books/${b.id}/approve`, { method: "POST" }), true)}>
                      {busy === `a${b.id}` ? <Spinner /> : <ICheck size={14} />} {C.approve}
                    </button>
                  )}
                  {b.status !== "rejected" && (
                    <button className="btn btn-danger btn-xs" disabled={!!busy} onClick={() => { setRejecting(b); setReason(""); }}>
                      <IX size={14} /> {C.reject}
                    </button>
                  )}
                  <button className="btn btn-soft btn-xs" onClick={() => setEditing(b)}>{C.editBook}</button>
                  <FilePick
                    accept="image/jpeg,image/png,image/webp"
                    busy={busy === `c${b.id}`}
                    className="btn btn-soft btn-xs"
                    onFile={(f) => {
                      const form = new FormData();
                      form.append("file", f);
                      void act(`c${b.id}`, () => api(`/system/catalog/books/${b.id}/cover`, { method: "PUT", form }), false);
                    }}
                    label={<><IImage size={14} /> {C.cover}</>}
                  />
                  {b.cover && (
                    <button className="btn btn-soft btn-xs" disabled={!!busy} onClick={() => act(`x${b.id}`, () => api(`/system/catalog/books/${b.id}/cover`, { method: "DELETE" }), false)}>
                      <ITrash size={14} /> {C.deleteCover}
                    </button>
                  )}
                </div>
              </div>
              <span className={`badge ${b.status === "approved" ? "b-ok" : b.status === "rejected" ? "b-err" : "b-warn"}`}>{d.enums.bookStatus[b.status]}</span>
            </div>
          ))}
        </div>
      )}
      {data && <Pager page={data.page} pages={data.pages} onPage={setPage} />}

      {rejecting && (
        <Modal title={C.reject} onClose={() => setRejecting(null)}>
          <strong>{rejecting.title}</strong>
          <Field label={C.rejectReason}>
            <textarea className="inp" minLength={3} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} />
          </Field>
          <div className="row" style={{ justifyContent: "flex-end" }}>
            <button className="btn btn-soft btn-sm" onClick={() => setRejecting(null)}>{d.common.cancel}</button>
            <button
              className="btn btn-danger btn-sm"
              disabled={!!busy || reason.trim().length < 3}
              onClick={async () => {
                if (await act(`r${rejecting.id}`, () => api(`/system/catalog/books/${rejecting.id}/reject`, { json: { reason: reason.trim() } }), true)) setRejecting(null);
              }}
            >
              {C.reject}
            </button>
          </div>
        </Modal>
      )}
      {editing && (
        <EditBook
          book={editing}
          onClose={() => setEditing(null)}
          onSaved={(b) => {
            put(b);
            setEditing(null);
          }}
        />
      )}
    </>
  );
}

function EditBook({ book, onClose, onSaved }: { book: BookOut; onClose: () => void; onSaved: (b: BookOut) => void }) {
  const { d } = useApp();
  const [f, setF] = useState({
    isbn: book.isbn13 ?? "",
    title: book.title,
    subtitle: book.subtitle ?? "",
    authors: book.authors.map((a) => a.name).join(", "),
    publisher: book.publisher?.name ?? "",
    language: book.language,
    script: book.script,
    published_year: book.published_year ? String(book.published_year) : "",
    pages: book.pages ? String(book.pages) : "",
    description: book.description ?? "",
    mxik_code: book.mxik_code ?? "",
    package_code: book.package_code ?? "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const body: BookUpdate = {
      isbn: f.isbn.trim() || null,
      title: f.title.trim(),
      subtitle: f.subtitle.trim() || null,
      authors: f.authors.split(",").map((x) => x.trim()).filter(Boolean),
      publisher: f.publisher.trim() || null,
      language: f.language as BookLanguage,
      script: f.script as BookScript,
      published_year: f.published_year ? Number(f.published_year) : null,
      pages: f.pages ? Number(f.pages) : null,
      description: f.description.trim() || null,
      mxik_code: f.mxik_code.trim() || null,
      package_code: f.package_code.trim() || null,
    };
    try {
      onSaved(await api<BookOut>(`/system/catalog/books/${book.id}`, { method: "PATCH", json: body }));
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={d.system.catalog.editBook} onClose={onClose} wide>
      <form className="stack" onSubmit={save}>
        <div className="grid-2">
          <Field label={d.add.bTitle}><input className="inp" required maxLength={300} value={f.title} onChange={set("title")} /></Field>
          <Field label={d.add.bSubtitle} optional><input className="inp" maxLength={300} value={f.subtitle} onChange={set("subtitle")} /></Field>
          <Field label={d.add.bAuthors} hint={d.add.bAuthorsHint}><input className="inp" required value={f.authors} onChange={set("authors")} /></Field>
          <Field label={d.add.bPublisher} optional><input className="inp" maxLength={160} value={f.publisher} onChange={set("publisher")} /></Field>
          <Field label={d.add.bIsbn} optional><input className="inp mono" maxLength={20} value={f.isbn} onChange={set("isbn")} /></Field>
          <div className="grid-2" style={{ gap: 12 }}>
            <Field label={d.add.bLanguage}>
              <select className="inp" value={f.language} onChange={set("language")}>
                {(["uz", "ru", "en", "other"] as BookLanguage[]).map((l) => <option key={l} value={l}>{d.enums.bookLanguage[l]}</option>)}
              </select>
            </Field>
            <Field label={d.add.bScript}>
              <select className="inp" value={f.script} onChange={set("script")}>
                {(["latn", "cyrl", "other"] as BookScript[]).map((s) => <option key={s} value={s}>{d.enums.bookScript[s]}</option>)}
              </select>
            </Field>
          </div>
          <div className="grid-2" style={{ gap: 12 }}>
            <Field label={d.add.bYear} optional><input className="inp" inputMode="numeric" value={f.published_year} onChange={set("published_year")} /></Field>
            <Field label={d.add.bPages} optional><input className="inp" inputMode="numeric" value={f.pages} onChange={set("pages")} /></Field>
          </div>
          <div className="grid-2" style={{ gap: 12 }}>
            <Field label={d.add.bMxik} optional><input className="inp mono" value={f.mxik_code} onChange={set("mxik_code")} /></Field>
            <Field label={d.add.bPackage} optional><input className="inp mono" value={f.package_code} onChange={set("package_code")} /></Field>
          </div>
        </div>
        <Field label={d.add.bDescription} optional><textarea className="inp" maxLength={5000} value={f.description} onChange={set("description")} /></Field>
        <ErrorBox error={error} />
        <div className="row" style={{ justifyContent: "flex-end" }}>
          <button type="button" className="btn btn-soft btn-sm" onClick={onClose}>{d.common.cancel}</button>
          <button className="btn btn-primary btn-sm" disabled={busy}>{busy && <Spinner />} {d.common.save}</button>
        </div>
      </form>
    </Modal>
  );
}
