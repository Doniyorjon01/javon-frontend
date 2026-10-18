"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useApp } from "@/components/app";
import { ErrorBox, Field, Spinner } from "@/components/ui";
import { ApiError, api } from "@/lib/api";
import type { MeOut, TelegramLoginIn } from "@/lib/types";

declare global {
  interface Window {
    onJavonTelegramAuth?: (user: TelegramLoginIn) => void;
  }
}

/** Only our own paths: "/admin/3", never "//evil.com" or "https://…". */
function safeNext(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return "/admin";
  return next;
}

export function LoginForm() {
  const { d, config } = useApp();
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const widgetRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [devId, setDevId] = useState("100001");
  const [devName, setDevName] = useState("Test");

  // Already signed in: go on.
  useEffect(() => {
    api<MeOut>("/auth/me")
      .then(() => router.replace(next))
      .catch(() => undefined);
  }, [router, next]);

  useEffect(() => {
    if (!config.telegramBot || !widgetRef.current) return;
    window.onJavonTelegramAuth = async (user) => {
      setBusy(true);
      setError(null);
      try {
        // The widget payload goes to the API exactly as Telegram signed it.
        await api<MeOut>("/auth/telegram", { json: user });
        router.replace(next);
      } catch (e) {
        setError(e as ApiError);
        setBusy(false);
      }
    };
    const s = document.createElement("script");
    s.src = "https://telegram.org/js/telegram-widget.js?22";
    s.async = true;
    s.setAttribute("data-telegram-login", config.telegramBot);
    s.setAttribute("data-size", "large");
    s.setAttribute("data-radius", "14");
    s.setAttribute("data-request-access", "write");
    s.setAttribute("data-onauth", "onJavonTelegramAuth(user)");
    const box = widgetRef.current;
    box.innerHTML = "";
    box.appendChild(s);
    return () => {
      box.innerHTML = "";
      delete window.onJavonTelegramAuth;
    };
  }, [config.telegramBot, next, router]);

  async function devLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api<MeOut>("/auth/dev-login", { json: { telegram_id: Number(devId), first_name: devName } });
      router.replace(next);
    } catch (err) {
      setError(err as ApiError);
      setBusy(false);
    }
  }

  return (
    <div className="auth-box">
      <h1>{d.login.title}</h1>
      <p className="muted" style={{ fontSize: 17 }}>{d.login.text}</p>
      <div className="card stack" style={{ alignItems: "flex-start" }}>
        {config.telegramBot ? (
          <>
            <span className="muted small">{d.login.widgetHint}</span>
            <div ref={widgetRef} style={{ minHeight: 48 }} />
          </>
        ) : (
          <div className="note note-warn">{d.login.noBot}</div>
        )}
        {busy && (
          <span className="row muted small">
            <Spinner /> {d.login.signingIn}
          </span>
        )}
      </div>
      <ErrorBox error={error} />
      {config.devLogin && (
        <form className="card stack" onSubmit={devLogin} style={{ borderStyle: "dashed" }}>
          <div>
            <strong>{d.login.devTitle}</strong>
            <p className="muted small">{d.login.devText}</p>
          </div>
          <div className="grid-2">
            <Field label={d.login.devId}>
              <input className="inp" inputMode="numeric" value={devId} onChange={(e) => setDevId(e.target.value.replace(/\D/g, ""))} required />
            </Field>
            <Field label={d.login.devName}>
              <input className="inp" value={devName} onChange={(e) => setDevName(e.target.value)} required maxLength={128} />
            </Field>
          </div>
          <button className="btn btn-ink" disabled={busy || !devId}>
            {d.login.devSubmit}
          </button>
        </form>
      )}
      <p className="muted xs">{d.login.terms}</p>
    </div>
  );
}
