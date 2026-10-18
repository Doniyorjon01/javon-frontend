"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "../app";
import { IBack, ILogout } from "../icons";
import { LangSwitch, Logo } from "../ui";
import { useSession } from "./session";

export function SystemShell({ children }: { children: React.ReactNode }) {
  const { d } = useApp();
  const { me, logout } = useSession();
  const pathname = usePathname();
  if (!me.user.is_platform_admin) {
    return (
      <div className="auth-box" style={{ marginTop: "18vh", textAlign: "center", alignItems: "center" }}>
        <span className="mono muted">404</span>
        <h1>{d.common.notFoundTitle}</h1>
        <Link href="/admin?list=1" className="btn btn-ink">{d.stores.title}</Link>
      </div>
    );
  }
  const items: Array<[string, string]> = [
    ["/system", d.system.nav.metrics],
    ["/system/catalog", d.system.nav.catalog],
    ["/system/stores", d.system.nav.stores],
    ["/system/users", d.system.nav.users],
    ["/system/jobs", d.system.nav.jobs],
  ];
  return (
    <div style={{ minHeight: "100vh" }}>
      <header style={{ background: "var(--ink)", color: "var(--paper)" }}>
        <div className="container row-between" style={{ padding: "14px 20px" }}>
          <div className="row" style={{ gap: 16 }}>
            <Logo dark href="/system" />
            <span className="badge" style={{ background: "var(--saffron)", color: "var(--ink)" }}>{d.system.title}</span>
          </div>
          <div className="row">
            <LangSwitch />
            <Link href="/admin?list=1" className="btn btn-ghost-d btn-xs">
              <IBack size={14} /> {d.stores.title}
            </Link>
            <button className="btn btn-ghost-d btn-xs" onClick={logout}>
              <ILogout size={14} /> {d.common.logout}
            </button>
          </div>
        </div>
        <nav className="container tabs" style={{ paddingBottom: 12 }}>
          {items.map(([href, label]) => {
            const on = href === "/system" ? pathname === href : pathname.startsWith(href);
            return (
              <Link key={href} href={href} className={`tab ${on ? "on" : ""}`} style={on ? { background: "var(--paper)", color: "var(--ink)" } : { color: "#c3c6cf" }}>
                {label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="container" style={{ padding: "28px 20px 60px" }}>
        {children}
      </main>
    </div>
  );
}
