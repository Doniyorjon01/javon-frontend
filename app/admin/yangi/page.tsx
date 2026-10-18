"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useApp } from "@/components/app";
import { useSession } from "@/components/admin/session";
import { IArrow, IBack, ICheck, IX } from "@/components/icons";
import { ErrorBox, Field, LangSwitch, Logo, Spinner } from "@/components/ui";
import { ApiError, api } from "@/lib/api";
import { hostOf, storeUrl } from "@/lib/format";
import { fmt } from "@/lib/i18n";
import { useDebounced } from "@/lib/hooks";
import type { PlansOut, SlugCheckOut, TenantOut } from "@/lib/types";

export default function CreateStore() {
  const { d, config } = useApp();
  const { reload } = useSession();
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [check, setCheck] = useState<SlugCheckOut | null>(null);
  const [checking, setChecking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [trialDays, setTrialDays] = useState(14);

  const dName = useDebounced(name, 350);
  const dSlug = useDebounced(slug, 350);

  useEffect(() => {
    api<PlansOut>("/plans").then((p) => setTrialDays(p.trial_days)).catch(() => undefined);
  }, []);

  // The address follows the name until the owner edits it.
  useEffect(() => {
    const q = slugTouched ? { slug: dSlug } : { name: dName };
    if (!(slugTouched ? dSlug : dName).trim()) {
      setCheck(null);
      return;
    }
    let live = true;
    setChecking(true);
    api<SlugCheckOut>("/tenants/slug-check", { query: q })
      .then((r) => {
        if (!live) return;
        setCheck(r);
        if (!slugTouched) setSlug(r.slug);
      })
      .catch(() => live && setCheck(null))
      .finally(() => live && setChecking(false));
    return () => {
      live = false;
    };
  }, [dName, dSlug, slugTouched]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const t = await api<TenantOut>("/tenants", { json: { name: name.trim(), slug } });
      await reload();
      router.replace(`/admin/${t.id}/setup`);
    } catch (err) {
      setError(err as ApiError);
      setBusy(false);
    }
  }

  const reason =
    check && !check.available
      ? check.reason === "taken"
        ? d.stores.slugTaken
        : check.reason === "reserved"
          ? d.stores.slugReserved
          : d.stores.slugInvalid
      : null;

  return (
    <main className="auth-page">
      <header className="topbar">
        <Logo href="/admin?list=1" />
        <LangSwitch />
      </header>
      <form className="auth-box" onSubmit={submit} style={{ maxWidth: 560 }}>
        <Link href="/admin?list=1" className="btn-link row" style={{ gap: 6 }}>
          <IBack size={16} /> {d.stores.title}
        </Link>
        <h1>{d.stores.createTitle}</h1>
        <p className="muted">{d.stores.createText}</p>
        <div className="card stack">
          <Field label={d.stores.name}>
            <input className="inp" value={name} onChange={(e) => setName(e.target.value)} placeholder={d.stores.namePh} minLength={2} maxLength={80} required autoFocus />
          </Field>
          <Field label={d.stores.slug} hint={d.stores.slugHint} error={reason}>
            <div className="inp-wrap">
              <input
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                }}
                minLength={3}
                maxLength={40}
                required
                className="mono"
                aria-describedby="slug-preview"
              />
              {checking ? <Spinner /> : check?.available ? <ICheck size={18} color="#2A9D8F" /> : check ? <IX size={18} color="#E5484D" /> : null}
            </div>
          </Field>
          {slug && (
            <span id="slug-preview" className="badge b-info mono" style={{ alignSelf: "flex-start" }}>
              {hostOf(storeUrl(config.storeUrlTemplate, slug))}
            </span>
          )}
          {check && !check.available && check.suggestions && check.suggestions.length > 0 && (
            <div className="stack-sm">
              <span className="small muted">{d.stores.suggestions}</span>
              <div className="chips">
                {check.suggestions.map((s) => (
                  <button
                    type="button"
                    key={s}
                    className="chip mono"
                    onClick={() => {
                      setSlugTouched(true);
                      setSlug(s);
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <ErrorBox error={error} />
        <button className="btn btn-primary" disabled={busy || !name.trim() || !slug || (check !== null && !check.available)}>
          {busy && <Spinner />} {d.stores.createBtn} <IArrow className="arr" size={18} />
        </button>
        <p className="muted small">{fmt(d.stores.trialNote, { days: trialDays })}</p>
      </form>
    </main>
  );
}
