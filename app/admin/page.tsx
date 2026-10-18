"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { useApp } from "@/components/app";
import { useSession } from "@/components/admin/session";
import { IArrow, ILogout, IPlus, IShield, IStore } from "@/components/icons";
import { Empty, LangSwitch, Logo } from "@/components/ui";
import { storeUrl, hostOf } from "@/lib/format";

function StoresList() {
  const { d, config } = useApp();
  const { me, logout } = useSession();
  const router = useRouter();
  const params = useSearchParams();
  const showList = params.get("list") === "1";

  useEffect(() => {
    if (!showList && me.stores.length === 1 && !me.user.is_platform_admin) {
      router.replace(`/admin/${me.stores[0].tenant_id}`);
    }
  }, [me, showList, router]);

  return (
    <main className="auth-page">
      <header className="topbar">
        <Logo />
        <div className="row">
          <LangSwitch />
          <button className="btn btn-soft btn-sm" onClick={logout}>
            <ILogout size={16} /> {d.common.logout}
          </button>
        </div>
      </header>
      <div className="container stack" style={{ maxWidth: 760, gap: 20, paddingTop: 20, paddingBottom: 60 }}>
        <div className="row-between">
          <h1 className="serif" style={{ fontSize: 36, fontWeight: 600, letterSpacing: "-0.02em" }}>
            {d.stores.title}
          </h1>
          <Link href="/admin/yangi" className="btn btn-primary btn-sm">
            <IPlus size={16} /> {d.stores.create}
          </Link>
        </div>
        {me.user.is_platform_admin && (
          <Link href="/system" className="card lift row" style={{ textDecoration: "none", color: "inherit" }}>
            <IShield /> <strong className="grow">{d.stores.platformAdmin}</strong> <IArrow size={18} />
          </Link>
        )}
        {me.stores.length === 0 ? (
          <div className="card">
            <Empty icon={<IStore />} title={d.stores.empty} text={d.stores.emptyText}>
              <Link href="/admin/yangi" className="btn btn-primary">
                {d.stores.create} <IArrow className="arr" size={18} />
              </Link>
            </Empty>
          </div>
        ) : (
          <div className="stack-sm" style={{ gap: 12 }}>
            {me.stores.map((s) => (
              <Link key={s.tenant_id} href={`/admin/${s.tenant_id}`} className="card lift row" style={{ textDecoration: "none", color: "inherit" }}>
                <span className="logo-prev" style={{ width: 52, height: 52, fontSize: 22, borderRadius: 14, background: "var(--saffron)" }}>
                  {s.name.slice(0, 1).toUpperCase()}
                </span>
                <span className="grow">
                  <strong style={{ fontSize: 18 }}>{s.name}</strong>
                  <br />
                  <span className="muted small mono">{hostOf(storeUrl(config.storeUrlTemplate, s.slug))}</span>
                </span>
                <span className="stack-sm" style={{ alignItems: "flex-end" }}>
                  <span className={`badge ${s.launched_at ? "b-ok" : "b-warn"}`}>{s.launched_at ? d.stores.launched : d.stores.notLaunched}</span>
                  <span className="muted xs">
                    {d.enums.role[s.role]} · {d.enums.access[s.access]}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

export default function AdminIndex() {
  return (
    <Suspense>
      <StoresList />
    </Suspense>
  );
}
