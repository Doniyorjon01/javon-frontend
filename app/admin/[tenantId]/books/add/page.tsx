"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useApp } from "@/components/app";
import { BookCover } from "@/components/book-cover";
import { Scanner } from "@/components/admin/scanner";
import { OwnerOnly, PageHead } from "@/components/admin/shell";
import { useStore } from "@/components/admin/store";
import { IArrow, ICheck, IMinus, IPlus, ISearch } from "@/components/icons";
import { ErrorBox, Field, FilePick, Loading, Pager, Spinner } from "@/components/ui";
import { ApiError, api } from "@/lib/api";
import { currency, groupDigits, parseSom, prettyIsbn } from "@/lib/format";
import { fmt } from "@/lib/i18n";
import { useApi, useDebounced } from "@/lib/hooks";
import type { BookCreate, BookLanguage, BookOut, BookScript, InventoryItemOut, Page } from "@/lib/types";

type Tab = "search" | "scan" | "isbn" | "create";

function AddInner() {
  const { d } = useApp();
  const { base } = useStore();
  const router = useRouter();
  const params = useSearchParams();
  const [tab, setTab] = useState<Tab>((params.get("tab") as Tab) || "search");
  const [picked, setPicked] = useState<BookOut | null>(null);
  const [added, setAdded] = useState(0);
  const [prefillIsbn, setPrefillIsbn] = useState("");

  const go = (t: Tab) => {
    setTab(t);
    router.replace(`${base}/books/add?tab=${t}`, { scroll: false });
  };

  return (
    <OwnerOnly note={d.books.staffNote}>
      <PageHead title={d.add.title} sub={added ? fmt(d.add.addedToday, { n: added }) : undefined}>
        <Link href={`${base}/books`} className="btn btn-soft btn-sm">
          {d.admin.nav.books}
        </Link>
      </PageHead>
      {picked ? (
        <AddToShelf
          book={picked}
          onDone={(ok) => {
            if (ok) setAdded((n) => n + 1);
            setPicked(null);
          }}
        />
      ) : (
        <div className="stack" style={{ maxWidth: 860 }}>
          <div className="seg" role="tablist" style={{ alignSelf: "flex-start" }}>
            {(["search", "scan", "isbn", "create"] as Tab[]).map((t) => (
              <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? "on" : ""} onClick={() => go(t)}>
                {d.add.tabs[t]}
              </button>
            ))}
          </div>
          {tab === "search" && <SearchTab onPick={setPicked} onCreate={() => go("create")} />}
          {(tab === "scan" || tab === "isbn") && (
            <IsbnTab
              scan={tab === "scan"}
              onPick={setPicked}
              onCreate={(isbn) => {
                setPrefillIsbn(isbn);
                go("create");
              }}
            />
          )}
          {tab === "create" && <CreateTab isbn={prefillIsbn} onCreated={setPicked} />}
        </div>
      )}
    </OwnerOnly>
  );
}

function SearchTab({ onPick, onCreate }: { onPick: (b: BookOut) => void; onCreate: () => void }) {
  const { d } = useApp();
  const { id } = useStore();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const dq = useDebounced(q.trim(), 350);
  useEffect(() => setPage(1), [dq]);
  const { data, error, loading } = useApi<Page<BookOut>>(dq.length >= 2 ? `/tenants/${id}/catalog/books` : null, {
    q: dq,
    page,
    size: 20,
  });
  return (
    <div className="card stack">
      <div className="inp-wrap">
        <ISearch size={20} />
        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={d.add.searchPh} aria-label={d.common.search} />
        {loading && <Spinner />}
      </div>
      <span className="muted small">{d.add.searchHint}</span>
      <ErrorBox error={error} />
      {dq.length >= 2 && data && (
        <div className="stack-sm" style={{ gap: 2 }}>
          {data.items.length === 0 && <p className="muted">{d.common.nothing}</p>}
          {data.items.map((b) => (
            <div key={b.id} className="srow">
              <BookCover title={b.title} authors={b.authors} cover={b.cover} size="s" className="bthumb" />
              <div style={{ minWidth: 0 }}>
                <strong>{b.title}</strong>
                <br />
                <span className="muted small">
                  {b.authors.map((a) => a.name).join(", ")}
                  {b.publisher && ` · ${b.publisher.name}`} · {d.enums.bookLanguage[b.language]} · {d.enums.bookScript[b.script]}
                  {b.isbn13 && <span className="mono xs"> · {prettyIsbn(b.isbn13)}</span>}
                </span>
                {b.status === "pending" && <span className="badge b-warn" style={{ marginLeft: 6 }}>{d.enums.bookStatus.pending}</span>}
              </div>
              <button className="add btn btn-primary btn-xs" onClick={() => onPick(b)}>
                <IPlus size={14} /> {d.add.addToShelf}
              </button>
            </div>
          ))}
          <Pager page={data.page} pages={data.pages} onPage={setPage} />
        </div>
      )}
      <div className="row" style={{ borderTop: "1px solid var(--line)", paddingTop: 14 }}>
        <span className="muted small">{d.add.notInCatalog}</span>
        <button className="btn-link small" onClick={onCreate}>
          {d.add.createNew} →
        </button>
      </div>
    </div>
  );
}

function IsbnTab({ scan, onPick, onCreate }: { scan: boolean; onPick: (b: BookOut) => void; onCreate: (isbn: string) => void }) {
  const { d } = useApp();
  const { id, base } = useStore();
  const [isbn, setIsbn] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ kind: "shelf"; item: InventoryItemOut } | { kind: "missing"; isbn: string } | null>(null);
  const [error, setError] = useState<ApiError | null>(null);

  async function lookup(code: string) {
    const clean = code.replace(/[^0-9Xx]/g, "");
    if (clean.length < 10) return;
    setIsbn(clean);
    setBusy(true);
    setResult(null);
    setError(null);
    try {
      try {
        const item = await api<InventoryItemOut>(`/tenants/${id}/inventory/isbn/${clean}`);
        setResult({ kind: "shelf", item });
        return;
      } catch (e) {
        if (!(e instanceof ApiError) || e.status !== 404) throw e;
      }
      try {
        const book = await api<BookOut>(`/tenants/${id}/catalog/isbn/${clean}`);
        onPick(book);
      } catch (e) {
        if (e instanceof ApiError && e.status === 404 && e.code === "book_isbn_not_found") setResult({ kind: "missing", isbn: clean });
        else throw e;
      }
    } catch (e) {
      setError(e as ApiError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card stack">
      {scan && <Scanner onCode={lookup} />}
      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          void lookup(isbn);
        }}
      >
        <Field label={d.add.isbnLabel}>
          <input className="inp mono" inputMode="numeric" value={isbn} onChange={(e) => setIsbn(e.target.value)} maxLength={20} autoFocus={!scan} />
        </Field>
        <button className="btn btn-ink" style={{ alignSelf: "flex-end" }} disabled={busy || isbn.replace(/\D/g, "").length < 10}>
          {busy && <Spinner />} {d.add.isbnFind}
        </button>
      </form>
      <ErrorBox error={error} />
      {result?.kind === "shelf" && (
        <div className="note note-info row-between">
          <span>
            {d.add.alreadyOnShelf} <strong>{result.item.book.title}</strong>
          </span>
          <Link href={`${base}/books?filter=all`} className="btn btn-soft btn-xs">
            {d.add.goToItem}
          </Link>
        </div>
      )}
      {result?.kind === "missing" && (
        <div className="note note-warn row-between">
          <span>{d.add.notFoundIsbn}</span>
          <button className="btn btn-ink btn-xs" onClick={() => onCreate(result.isbn)}>
            {d.add.createNew}
          </button>
        </div>
      )}
    </div>
  );
}

function CreateTab({ isbn: initialIsbn, onCreated }: { isbn: string; onCreated: (b: BookOut) => void }) {
  const { d, toast } = useApp();
  const { id } = useStore();
  const [f, setF] = useState({
    isbn: initialIsbn,
    title: "",
    subtitle: "",
    authors: "",
    publisher: "",
    language: "uz" as BookLanguage,
    script: "" as BookScript | "",
    published_year: "",
    pages: "",
    description: "",
    mxik_code: "",
    package_code: "",
  });
  const [cover, setCover] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const body: BookCreate = {
      title: f.title.trim(),
      authors: f.authors.split(",").map((a) => a.trim()).filter(Boolean),
      isbn: f.isbn.trim() || null,
      subtitle: f.subtitle.trim() || null,
      publisher: f.publisher.trim() || null,
      language: f.language,
      script: f.script || null,
      published_year: f.published_year ? Number(f.published_year) : null,
      pages: f.pages ? Number(f.pages) : null,
      description: f.description.trim() || null,
      mxik_code: f.mxik_code.trim() || null,
      package_code: f.package_code.trim() || null,
    };
    try {
      let book: BookOut;
      try {
        book = await api<BookOut>(`/tenants/${id}/catalog/books`, { json: body });
      } catch (err) {
        if (err instanceof ApiError && err.code === "book_duplicate" && typeof err.detail.book_id === "number") {
          toast(d.add.duplicate);
          book = await api<BookOut>(`/tenants/${id}/catalog/books/${err.detail.book_id}`);
        } else if (err instanceof ApiError && err.code === "book_isbn_exists" && body.isbn) {
          toast(d.add.duplicate);
          book = await api<BookOut>(`/tenants/${id}/catalog/isbn/${encodeURIComponent(body.isbn)}`);
        } else throw err;
      }
      if (cover && !book.cover) {
        const form = new FormData();
        form.append("file", cover);
        try {
          book = await api<BookOut>(`/tenants/${id}/catalog/books/${book.id}/cover`, { method: "PUT", form });
        } catch (err) {
          toast((err as ApiError).readable, "err");
        }
      }
      onCreated(book);
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="card stack" onSubmit={submit}>
      <div>
        <h2>{d.add.createTitle}</h2>
        <p className="muted small">{d.add.createText}</p>
      </div>
      <div className="grid-2">
        <Field label={d.add.bTitle}>
          <input className="inp" required minLength={1} maxLength={300} value={f.title} onChange={set("title")} />
        </Field>
        <Field label={d.add.bSubtitle} optional>
          <input className="inp" maxLength={300} value={f.subtitle} onChange={set("subtitle")} />
        </Field>
        <Field label={d.add.bAuthors} hint={d.add.bAuthorsHint}>
          <input className="inp" required value={f.authors} onChange={set("authors")} />
        </Field>
        <Field label={d.add.bPublisher} optional>
          <input className="inp" maxLength={160} value={f.publisher} onChange={set("publisher")} />
        </Field>
        <Field label={d.add.bIsbn} optional>
          <input className="inp mono" inputMode="numeric" maxLength={20} value={f.isbn} onChange={set("isbn")} />
        </Field>
        <div className="grid-2" style={{ gap: 12 }}>
          <Field label={d.add.bLanguage}>
            <select className="inp" value={f.language} onChange={set("language")}>
              {(["uz", "ru", "en", "other"] as BookLanguage[]).map((l) => (
                <option key={l} value={l}>{d.enums.bookLanguage[l]}</option>
              ))}
            </select>
          </Field>
          <Field label={d.add.bScript}>
            <select className="inp" value={f.script} onChange={set("script")}>
              <option value="">{d.add.bScriptAuto}</option>
              {(["latn", "cyrl", "other"] as BookScript[]).map((s) => (
                <option key={s} value={s}>{d.enums.bookScript[s]}</option>
              ))}
            </select>
          </Field>
        </div>
        <div className="grid-2" style={{ gap: 12 }}>
          <Field label={d.add.bYear} optional>
            <input className="inp" inputMode="numeric" value={f.published_year} onChange={(e) => setF({ ...f, published_year: e.target.value.replace(/\D/g, "").slice(0, 4) })} />
          </Field>
          <Field label={d.add.bPages} optional>
            <input className="inp" inputMode="numeric" value={f.pages} onChange={(e) => setF({ ...f, pages: e.target.value.replace(/\D/g, "").slice(0, 5) })} />
          </Field>
        </div>
        <div className="grid-2" style={{ gap: 12 }}>
          <Field label={d.add.bMxik} optional>
            <input className="inp mono" inputMode="numeric" value={f.mxik_code} onChange={(e) => setF({ ...f, mxik_code: e.target.value.replace(/\D/g, "").slice(0, 17) })} />
          </Field>
          <Field label={d.add.bPackage} optional>
            <input className="inp mono" inputMode="numeric" value={f.package_code} onChange={(e) => setF({ ...f, package_code: e.target.value.replace(/\D/g, "").slice(0, 20) })} />
          </Field>
        </div>
      </div>
      <Field label={d.add.bDescription} optional>
        <textarea className="inp" maxLength={5000} value={f.description} onChange={set("description")} />
      </Field>
      <div className="row">
        <FilePick accept="image/jpeg,image/png,image/webp" onFile={setCover} label={d.add.bCover} />
        {cover && <span className="small muted">{cover.name}</span>}
      </div>
      <ErrorBox error={error} />
      <button className="btn btn-primary" disabled={busy}>
        {busy && <Spinner />} {d.add.createAndAdd} <IArrow className="arr" size={18} />
      </button>
    </form>
  );
}

function AddToShelf({ book, onDone }: { book: BookOut; onDone: (ok: boolean) => void }) {
  const { d, lang, toast } = useApp();
  const { id, base, readOnly } = useStore();
  const [price, setPrice] = useState("");
  const [qty, setQty] = useState(1);
  const [visible, setVisible] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const tiyin = parseSom(price);
    if (tiyin === null) return;
    setBusy(true);
    setError(null);
    try {
      await api<InventoryItemOut>(`/tenants/${id}/inventory`, {
        json: { book_id: book.id, price: tiyin, quantity: qty, is_visible: visible },
      });
      toast(fmt(d.add.added, { title: book.title }), "ok");
      onDone(true);
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="card stack" style={{ maxWidth: 640 }} onSubmit={save}>
      <div className="row" style={{ alignItems: "flex-start", gap: 16 }}>
        <BookCover title={book.title} authors={book.authors} cover={book.cover} size="m" style={{ width: 84, fontSize: 10 }} />
        <div className="stack-sm" style={{ gap: 4, minWidth: 0 }}>
          <span className="badge b-ok" style={{ alignSelf: "flex-start" }}>
            <ICheck size={13} /> {d.add.foundInCatalog}
          </span>
          <strong className="serif" style={{ fontSize: 22 }}>{book.title}</strong>
          <span className="muted small">
            {book.authors.map((a) => a.name).join(", ")} · {d.enums.bookLanguage[book.language]} · {d.enums.bookScript[book.script]}
          </span>
          {book.isbn13 && <span className="mono xs muted">ISBN {prettyIsbn(book.isbn13)}</span>}
          {book.status === "pending" && <span className="small" style={{ color: "var(--amber-ink)" }}>{d.books.statusPending}</span>}
        </div>
      </div>
      <div className="grid-2" style={{ alignItems: "end" }}>
        <Field label={d.add.priceSom}>
          <div className="inp-wrap">
            <input autoFocus inputMode="numeric" required value={price} onChange={(e) => setPrice(groupDigits(e.target.value))} placeholder="65 000" style={{ fontSize: 20 }} />
            <span className="suffix">{currency(lang)}</span>
          </div>
        </Field>
        <Field label={d.add.qty}>
          <span className="qty" style={{ minHeight: 48 }}>
            <button type="button" onClick={() => setQty(Math.max(0, qty - 1))} aria-label="-1" style={{ width: 44, height: 44 }}>
              <IMinus size={16} />
            </button>
            <input inputMode="numeric" value={qty} onChange={(e) => setQty(Math.min(1_000_000, Number(e.target.value.replace(/\D/g, "")) || 0))} style={{ minHeight: 44, width: 64 }} />
            <button type="button" onClick={() => setQty(qty + 1)} aria-label="+1" style={{ width: 44, height: 44 }}>
              <IPlus size={16} />
            </button>
          </span>
        </Field>
      </div>
      <label className="check">
        <input type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} /> {d.add.visibleOnSite}
      </label>
      {error && (
        <div className="stack-sm">
          <ErrorBox error={error} />
          {error.code === "inventory_item_exists" && (
            <Link href={`${base}/books`} className="btn-link small">{d.add.goToItem} →</Link>
          )}
        </div>
      )}
      <button className="btn btn-primary" disabled={busy || readOnly || parseSom(price) === null}>
        {busy && <Spinner />} {d.add.saveNext} <IArrow className="arr" size={18} />
      </button>
      <button type="button" className="btn-link" style={{ alignSelf: "center", color: "var(--muted-2)" }} onClick={() => onDone(false)}>
        {d.add.otherBook}
      </button>
    </form>
  );
}

export default function AddBookPage() {
  return (
    <Suspense fallback={<Loading />}>
      <AddInner />
    </Suspense>
  );
}

