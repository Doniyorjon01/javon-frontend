"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useApp } from "@/components/app";
import { IArrow, IUsers } from "@/components/icons";
import { ErrorBox, LangSwitch, Loading, Logo, Spinner } from "@/components/ui";
import { ApiError, api } from "@/lib/api";
import { dateTime } from "@/lib/format";
import { fmt } from "@/lib/i18n";
import type { InvitePreviewOut, JoinedStoreOut, MeOut } from "@/lib/types";

export default function InvitePage() {
  const { d, lang, toast } = useApp();
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [preview, setPreview] = useState<InvitePreviewOut | null>(null);
  const [invalid, setInvalid] = useState(false);
  const [me, setMe] = useState<MeOut | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    api<InvitePreviewOut>(`/invites/${encodeURIComponent(token)}`)
      .then(setPreview)
      .catch(() => setInvalid(true));
    api<MeOut>("/auth/me")
      .then(setMe)
      .catch(() => setMe(null));
  }, [token]);

  async function accept() {
    setBusy(true);
    setError(null);
    try {
      const r = await api<JoinedStoreOut>(`/invites/${encodeURIComponent(token)}/accept`, { method: "POST" });
      toast(fmt(d.invite.joined, { store: r.name }), "ok");
      router.replace(`/admin/${r.tenant_id}`);
    } catch (e) {
      setError(e as ApiError);
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <header className="topbar">
        <Logo />
        <LangSwitch />
      </header>
      <div className="auth-box">
        <h1>{d.invite.title}</h1>
        {invalid ? (
          <div className="note note-err">{d.invite.invalid}</div>
        ) : !preview || me === undefined ? (
          <Loading />
        ) : (
          <div className="card stack">
            <div className="row">
              <span className="logo-prev" style={{ background: "var(--saffron)" }}>
                <IUsers />
              </span>
              <div>
                <p style={{ fontSize: 18 }}>{fmt(d.invite.text, { store: preview.store_name })}</p>
                <p className="muted small">{fmt(d.invite.expires, { date: dateTime(preview.expires_at, lang) })}</p>
              </div>
            </div>
            <ErrorBox error={error} />
            {me ? (
              <button className="btn btn-primary" onClick={accept} disabled={busy}>
                {busy && <Spinner />} {d.invite.accept} <IArrow className="arr" size={18} />
              </button>
            ) : (
              <>
                <p className="muted small">{d.invite.loginFirst}</p>
                <Link className="btn btn-primary" href={`/kirish?next=${encodeURIComponent(`/taklif/${token}`)}`}>
                  {d.common.login} <IArrow className="arr" size={18} />
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
