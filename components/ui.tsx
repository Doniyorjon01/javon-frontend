"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { ApiError } from "@/lib/api";
import { fmt, LANGS, type Lang } from "@/lib/i18n";
import { money } from "@/lib/format";
import type { OrderStatus, PaymentStatus } from "@/lib/types";
import { useApp, useT } from "./app";
import { IAlert, ICheck, ICopy, IRefresh, IX, LogoMark } from "./icons";

export function Spinner({ large = false }: { large?: boolean }) {
  return <span className={`spin ${large ? "spin-lg" : ""}`} aria-hidden="true" />;
}

export function Loading() {
  const d = useT();
  return (
    <div className="center-pad" role="status">
      <Spinner large />
      <span className="sr-only">{d.common.loading}</span>
    </div>
  );
}

export function ErrorBox({ error, onRetry }: { error: ApiError | Error | null | undefined; onRetry?: () => void }) {
  const d = useT();
  if (!error) return null;
  const msg = "readable" in error ? (error as ApiError).readable : error.message;
  return (
    <div className="note note-err row-between" role="alert">
      <span className="row" style={{ gap: 8 }}>
        <IAlert size={18} />
        {msg || d.common.errorLoad}
      </span>
      {onRetry && (
        <button className="btn btn-xs btn-soft" onClick={onRetry}>
          <IRefresh size={15} /> {d.common.retry}
        </button>
      )}
    </div>
  );
}

export function Empty({ icon, title, text, children }: { icon?: React.ReactNode; title: string; text?: string; children?: React.ReactNode }) {
  return (
    <div className="empty">
      {icon && <div className="ico">{icon}</div>}
      <strong>{title}</strong>
      {text && <p style={{ maxWidth: 420 }}>{text}</p>}
      {children}
    </div>
  );
}

export function Modal({
  title,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  const d = useT();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);
  return (
    <div className="modal-back" onMouseDown={onClose}>
      <div className={`modal ${wide ? "modal-wide" : ""}`} role="dialog" aria-modal="true" aria-label={title} onMouseDown={(e) => e.stopPropagation()}>
        <div className="row-between">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label={d.common.close}>
            <IX size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Pager({ page, pages, onPage }: { page: number; pages: number; onPage: (p: number) => void }) {
  const d = useT();
  if (pages <= 1) return null;
  return (
    <nav className="pager" aria-label="pagination">
      <button className="btn btn-soft btn-xs" disabled={page <= 1} onClick={() => onPage(page - 1)}>
        {d.common.prev}
      </button>
      <span>{fmt(d.common.pageOf, { page, pages })}</span>
      <button className="btn btn-soft btn-xs" disabled={page >= pages} onClick={() => onPage(page + 1)}>
        {d.common.nextPage}
      </button>
    </nav>
  );
}

export function Field({
  label,
  hint,
  error,
  children,
  optional,
}: {
  label: React.ReactNode;
  hint?: React.ReactNode;
  error?: string | null;
  children: React.ReactNode;
  optional?: boolean;
}) {
  const d = useT();
  return (
    <label className="field">
      <span>
        {label}
        {optional && <span className="hint"> · {d.common.optional}</span>}
      </span>
      {children}
      {hint && !error && <span className="hint">{hint}</span>}
      {error && <span className="err">{error}</span>}
    </label>
  );
}

export function Switch({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <label className="switch" title={label}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} aria-label={label} />
      <span />
    </label>
  );
}

const ORDER_BADGE: Record<OrderStatus, string> = {
  new: "b-new",
  accepted: "b-accepted",
  shipping: "b-shipping",
  completed: "b-completed",
  cancelled: "b-cancelled",
};

export function OrderBadge({ status }: { status: OrderStatus }) {
  const d = useT();
  return (
    <span className={`badge ${ORDER_BADGE[status]}`}>
      <span className="dot" />
      {d.enums.orderStatus[status]}
    </span>
  );
}

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  const d = useT();
  const cls = status === "paid" ? "b-ok" : status === "under_review" ? "b-warn" : "b-cancelled";
  return <span className={`badge ${cls}`}>{d.enums.paymentStatus[status]}</span>;
}

export function Money({ value }: { value: number }) {
  const { lang } = useApp();
  return <span className="nowrap">{money(value, lang)}</span>;
}

export function CopyButton({ text, label, className = "btn btn-soft btn-sm" }: { text: string; label?: string; className?: string }) {
  const d = useT();
  const [done, setDone] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          const ta = document.createElement("textarea");
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          ta.remove();
        }
        setDone(true);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => setDone(false), 1800);
      }}
    >
      {done ? <ICheck size={16} /> : <ICopy size={16} />}
      {done ? d.common.copied : label ?? d.common.copy}
    </button>
  );
}

export function LangSwitch({ only, className = "" }: { only?: Lang[]; className?: string }) {
  const { lang, setLang } = useApp();
  const list = only && only.length ? LANGS.filter((l) => only.includes(l)) : LANGS;
  if (list.length < 2) return null;
  return (
    <div className={`langs ${className}`} role="group" aria-label="Language">
      {list.map((l) => (
        <button key={l} className={l === lang ? "on" : ""} aria-pressed={l === lang} onClick={() => setLang(l)}>
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

export function Logo({ dark = false, href = "/" }: { dark?: boolean; href?: string }) {
  return (
    <Link href={href} className="logo" style={{ color: dark ? "#F7F6F2" : "#15171C" }}>
      <LogoMark dark={dark} />
      <span>
        javon<span className="tld">.uz</span>
      </span>
    </Link>
  );
}

/** Two-step file picker: shows the chosen name and calls onFile. */
export function FilePick({
  accept,
  onFile,
  label,
  busy,
  className = "btn btn-soft btn-sm",
}: {
  accept: string;
  onFile: (f: File) => void;
  label: React.ReactNode;
  busy?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={ref}
        type="file"
        accept={accept}
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = "";
        }}
      />
      <button type="button" className={className} disabled={busy} onClick={() => ref.current?.click()}>
        {busy ? <Spinner /> : null}
        {label}
      </button>
    </>
  );
}
