"use client";

/**
 * App-wide client context: language + dictionary, public runtime config,
 * toasts and a promise-based confirm dialog.
 */
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { setApiLang } from "@/lib/api";
import type { PublicConfig } from "@/lib/config";
import { LANG_COOKIE, type Dict, type Lang } from "@/lib/i18n";

type Toast = { id: number; text: string; kind: "info" | "ok" | "err" };
type ConfirmReq = {
  title: string;
  text?: string;
  ok: string;
  danger?: boolean;
  resolve: (v: boolean) => void;
};

type Ctx = {
  lang: Lang;
  d: Dict;
  config: PublicConfig;
  setLang: (lang: Lang) => void;
  toast: (text: string, kind?: Toast["kind"]) => void;
  confirm: (opts: { title: string; text?: string; ok?: string; danger?: boolean }) => Promise<boolean>;
};

const AppCtx = createContext<Ctx | null>(null);

export function AppProvider({
  lang,
  dict,
  config,
  children,
}: {
  lang: Lang;
  dict: Dict;
  config: PublicConfig;
  children: React.ReactNode;
}) {
  // Module-level so plain api() calls send the same Accept-Language.
  setApiLang(lang);
  const router = useRouter();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmReq, setConfirmReq] = useState<ConfirmReq | null>(null);
  const seq = useRef(0);

  const setLang = useCallback(
    (next: Lang) => {
      document.cookie = `${LANG_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
      setApiLang(next);
      router.refresh();
    },
    [router],
  );

  const toast = useCallback((text: string, kind: Toast["kind"] = "info") => {
    const id = ++seq.current;
    setToasts((t) => [...t.slice(-3), { id, text, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), kind === "err" ? 6000 : 3500);
  }, []);

  const confirm = useCallback(
    (opts: { title: string; text?: string; ok?: string; danger?: boolean }) =>
      new Promise<boolean>((resolve) => {
        setConfirmReq({ title: opts.title, text: opts.text, ok: opts.ok ?? dict.common.confirm, danger: opts.danger, resolve });
      }),
    [dict.common.confirm],
  );

  const value = useMemo(() => ({ lang, d: dict, config, setLang, toast, confirm }), [lang, dict, config, setLang, toast, confirm]);

  const close = (v: boolean) => {
    confirmReq?.resolve(v);
    setConfirmReq(null);
  };

  return (
    <AppCtx.Provider value={value}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast-item ${t.kind === "err" ? "err" : t.kind === "ok" ? "ok" : ""}`}>
            {t.text}
          </div>
        ))}
      </div>
      {confirmReq && (
        <div className="modal-back" onClick={() => close(false)}>
          <div className="modal" role="alertdialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h2>{confirmReq.title}</h2>
            {confirmReq.text && <p className="muted">{confirmReq.text}</p>}
            <div className="row" style={{ justifyContent: "flex-end" }}>
              <button className="btn btn-soft btn-sm" onClick={() => close(false)} autoFocus>
                {dict.common.cancel}
              </button>
              <button className={`btn btn-sm ${confirmReq.danger ? "btn-danger" : "btn-primary"}`} onClick={() => close(true)}>
                {confirmReq.ok}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppCtx.Provider>
  );
}

export function useApp(): Ctx {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error("useApp outside AppProvider");
  return ctx;
}

export function useT(): Dict {
  return useApp().d;
}
