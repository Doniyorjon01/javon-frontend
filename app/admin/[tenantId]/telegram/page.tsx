"use client";

import { useState } from "react";
import { useApp } from "@/components/app";
import { OwnerOnly, PageHead } from "@/components/admin/shell";
import { useStore } from "@/components/admin/store";
import { IExternal, ITelegram } from "@/components/icons";
import { CopyButton, ErrorBox, Field, Loading, Spinner } from "@/components/ui";
import { ApiError, api } from "@/lib/api";
import { fmt } from "@/lib/i18n";
import { useApi } from "@/lib/hooks";
import type { BotOut } from "@/lib/types";

export default function TelegramPage() {
  const { d, toast, confirm } = useApp();
  const { id, readOnly } = useStore();
  const bot = useApi<BotOut>(`/tenants/${id}/telegram`);
  const [token, setToken] = useState("");
  const [replace, setReplace] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const notConnected = bot.error?.status === 404;

  async function connect(e: React.FormEvent) {
    e.preventDefault();
    setBusy("connect");
    setError(null);
    try {
      bot.setData(await api<BotOut>(`/tenants/${id}/telegram`, { method: "PUT", json: { token: token.trim() } }));
      setToken("");
      setReplace(false);
      bot.reload();
      toast(d.common.saved, "ok");
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setBusy(null);
    }
  }
  async function test() {
    setBusy("test");
    try {
      await api(`/tenants/${id}/telegram/test`, { method: "POST" });
      toast(d.telegram.testSent, "ok");
    } catch (err) {
      toast((err as ApiError).readable, "err");
    } finally {
      setBusy(null);
    }
  }
  async function disconnect() {
    if (!(await confirm({ title: d.telegram.disconnect, text: d.telegram.disconnectConfirm, danger: true, ok: d.telegram.disconnect }))) return;
    setBusy("off");
    try {
      await api(`/tenants/${id}/telegram`, { method: "DELETE" });
      bot.setData(undefined);
      bot.reload();
    } catch (err) {
      toast((err as ApiError).readable, "err");
    } finally {
      setBusy(null);
    }
  }

  const form = (
    <form className="card stack" onSubmit={connect}>
      <h2>{d.telegram.howTitle}</h2>
      <ol className="stack-sm" style={{ paddingLeft: 20, margin: 0 }}>
        <li>{d.telegram.how1}</li>
        <li>{d.telegram.how2}</li>
        <li>{d.telegram.how3}</li>
      </ol>
      <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="btn btn-soft btn-sm" style={{ alignSelf: "flex-start" }}>
        <ITelegram size={16} /> @BotFather
      </a>
      <Field label={d.telegram.token}>
        <input className="inp mono" value={token} onChange={(e) => setToken(e.target.value)} placeholder={d.telegram.tokenPh} minLength={20} maxLength={100} required autoComplete="off" disabled={readOnly} />
      </Field>
      <ErrorBox error={error} />
      <button className="btn btn-primary" style={{ alignSelf: "flex-start" }} disabled={!!busy || readOnly || token.trim().length < 20}>
        {busy === "connect" && <Spinner />} {d.telegram.connect}
      </button>
    </form>
  );

  return (
    <OwnerOnly note={d.telegram.ownerOnly}>
      <PageHead title={d.telegram.title} sub={d.telegram.intro} />
      <div className="stack" style={{ maxWidth: 760 }}>
        {bot.loading && !bot.data && !bot.error ? (
          <Loading />
        ) : notConnected ? (
          form
        ) : bot.error ? (
          <ErrorBox error={bot.error} onRetry={bot.reload} />
        ) : bot.data ? (
          <>
            <div className="card stack">
              <div className="row-between">
                <div className="row">
                  <span className="logo-prev" style={{ width: 52, height: 52, background: "#229ED9", color: "#fff" }}>
                    <ITelegram />
                  </span>
                  <div>
                    <span className="muted small">{d.telegram.connected}</span>
                    <br />
                    <strong style={{ fontSize: 19 }}>@{bot.data.username}</strong>
                  </div>
                </div>
                <span className={`badge ${bot.data.status === "active" ? "b-ok" : "b-err"}`}>{d.enums.botStatus[bot.data.status]}</span>
              </div>
              {bot.data.status === "broken" && <div className="note note-err small">{fmt(d.telegram.broken, { error: bot.data.last_error ?? "—" })}</div>}
              <div className="row">
                <a href={bot.data.bot_url} target="_blank" rel="noreferrer" className="btn btn-soft btn-sm">
                  <IExternal size={16} /> {d.telegram.openBot}
                </a>
                <CopyButton text={bot.data.bot_url} />
              </div>
              <div className="field">
                <span>{d.telegram.miniApp}</span>
                <div className="row">
                  <span className="badge mono">{bot.data.mini_app_url}</span>
                </div>
              </div>
            </div>
            <div className="card stack">
              <h2>{d.telegram.group}</h2>
              {bot.data.group_linked ? (
                <div className="note note-ok">{fmt(d.telegram.groupLinked, { title: bot.data.group_title ?? "" })}</div>
              ) : (
                <div className="note note-warn">{d.telegram.groupNone}</div>
              )}
              <p className="muted small">{d.telegram.linkGroupHint}</p>
              <div className="row">
                <a href={bot.data.group_link_url} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm">
                  <ITelegram size={16} /> {d.telegram.linkGroup}
                </a>
                {bot.data.group_linked && (
                  <button className="btn btn-soft btn-sm" onClick={test} disabled={!!busy || readOnly}>
                    {busy === "test" && <Spinner />} {d.telegram.test}
                  </button>
                )}
              </div>
            </div>
            {replace ? (
              form
            ) : (
              <div className="row">
                <button className="btn btn-soft btn-sm" onClick={() => setReplace(true)} disabled={readOnly}>
                  {d.telegram.replace}
                </button>
                <button className="btn btn-danger btn-sm" onClick={disconnect} disabled={!!busy || readOnly}>
                  {busy === "off" && <Spinner />} {d.telegram.disconnect}
                </button>
              </div>
            )}
          </>
        ) : null}
      </div>
    </OwnerOnly>
  );
}
