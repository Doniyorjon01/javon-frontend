"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { daysUntil } from "@/lib/format";
import { fmt } from "@/lib/i18n";
import { useApp } from "../app";
import {
  IBook,
  IChart,
  ICard,
  IExternal,
  IHome,
  ILogout,
  IMenu,
  IOrders,
  IPlus,
  IQr,
  IRocket,
  ISettings,
  IShelf,
  IStore,
  ITelegram,
  IUpload,
  IUsers,
  IX,
} from "../icons";
import { LangSwitch } from "../ui";
import { useSession } from "./session";
import { useStore } from "./store";

type Item = { href: string; label: string; icon: React.ReactNode; owner?: boolean; count?: number; exact?: boolean };

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { d } = useApp();
  const { logout, me } = useSession();
  const store = useStore();
  const { base, tenant, isOwner, my, orderStats } = store;
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  const newCount = orderStats?.by_status?.new ?? 0;
  const groups: Array<{ title?: string; items: Item[] }> = [
    {
      items: [
        { href: base, label: d.admin.nav.home, icon: <IHome size={19} />, exact: true },
        { href: `${base}/orders`, label: d.admin.nav.orders, icon: <IOrders size={19} />, count: newCount },
        { href: `${base}/books`, label: d.admin.nav.books, icon: <IShelf size={19} />, exact: true },
        { href: `${base}/books/add`, label: d.admin.nav.add, icon: <IPlus size={19} />, owner: true },
        { href: `${base}/books/import`, label: d.admin.nav.import, icon: <IUpload size={19} />, owner: true },
        { href: `${base}/books/submissions`, label: d.admin.nav.submissions, icon: <IBook size={19} />, owner: true },
      ],
    },
    {
      items: [
        { href: `${base}/qr`, label: d.admin.nav.qr, icon: <IQr size={19} /> },
        { href: `${base}/stats`, label: d.admin.nav.stats, icon: <IChart size={19} />, owner: true },
      ],
    },
    {
      items: [
        ...(!tenant.launched_at ? [{ href: `${base}/setup`, label: d.admin.nav.setup, icon: <IRocket size={19} />, owner: true }] : []),
        { href: `${base}/settings`, label: d.admin.nav.settings, icon: <ISettings size={19} />, owner: true },
        { href: `${base}/telegram`, label: d.admin.nav.telegram, icon: <ITelegram size={19} />, owner: true },
        { href: `${base}/staff`, label: d.admin.nav.staff, icon: <IUsers size={19} /> },
        { href: `${base}/subscription`, label: d.admin.nav.subscription, icon: <ICard size={19} />, owner: true },
      ],
    },
  ];

  const isOn = (it: Item) => (it.exact ? pathname === it.href : pathname === it.href || pathname.startsWith(it.href + "/"));
  const trialDays = daysUntil(tenant.trial_ends_at);
  const logo = tenant.logo?.s ?? tenant.logo?.l;

  const side = (
    <aside className={`side ${open ? "open" : ""}`} aria-label={d.admin.nav.menu}>
      <div className="row-between" style={{ alignItems: "flex-start" }}>
        <Link href={base} className="store">
          <span className="av">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {logo ? <img src={logo} alt="" /> : tenant.name.slice(0, 1).toUpperCase()}
          </span>
          <span style={{ minWidth: 0 }}>
            <strong style={{ display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 160 }}>{tenant.name}</strong>
            <span className="xs" style={{ color: "#9a9ea8" }}>
              {d.enums.role[my.role]}
            </span>
          </span>
        </Link>
        {open && (
          <button className="icon-btn" style={{ background: "transparent", color: "#fff", borderColor: "#333" }} onClick={() => setOpen(false)} aria-label={d.common.close}>
            <IX size={18} />
          </button>
        )}
      </div>
      {groups.map((g, gi) => (
        <div key={gi} className="stack-sm" style={{ gap: 2, paddingTop: gi ? 12 : 0, borderTop: gi ? "1px solid #2a2d35" : 0, marginTop: gi ? 8 : 0 }}>
          {g.items
            .filter((it) => !it.owner || isOwner)
            .map((it) => (
              <Link key={it.href} href={it.href} className={`it ${isOn(it) ? "on" : ""}`} aria-current={isOn(it) ? "page" : undefined}>
                {it.icon}
                {it.label}
                {!!it.count && <span className="cnt">{it.count}</span>}
              </Link>
            ))}
        </div>
      ))}
      <div style={{ marginTop: "auto", paddingTop: 16 }} className="stack-sm">
        {isOwner && my.access === "trial" && trialDays !== null && (
          <div className="trial">
            <span className="xs mono" style={{ color: "var(--saffron)", letterSpacing: ".12em" }}>
              {d.enums.access.trial.toUpperCase()}
            </span>
            <strong>{trialDays > 0 ? fmt(d.admin.banner.trial, { days: trialDays }) : d.admin.banner.trialEnds}</strong>
            <Link href={`${base}/subscription`} className="btn btn-saffron btn-xs">
              {d.admin.banner.choosePlan}
            </Link>
          </div>
        )}
        {tenant.launched_at && (
          <a className="it" href={store.siteUrl} target="_blank" rel="noreferrer">
            <IExternal size={19} /> {d.admin.nav.openSite}
          </a>
        )}
        {(me.stores.length > 1 || me.user.is_platform_admin) && (
          <Link className="it" href="/admin?list=1">
            <IStore size={19} /> {d.admin.nav.allStores}
          </Link>
        )}
        <button className="it" onClick={logout}>
          <ILogout size={19} /> {d.common.logout}
        </button>
        <div style={{ padding: "6px 8px" }}>
          <LangSwitch />
        </div>
      </div>
    </aside>
  );

  return (
    <div className="adm">
      <div className="mtop">
        <button className="icon-btn" onClick={() => setOpen(true)} aria-label={d.admin.nav.menu}>
          <IMenu size={20} />
        </button>
        <strong style={{ maxWidth: "60vw", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tenant.name}</strong>
        <Link href={`${base}/orders`} className="icon-btn" aria-label={d.admin.nav.orders} style={{ position: "relative" }}>
          <IOrders size={20} />
          {newCount > 0 && (
            <span style={{ position: "absolute", top: -6, right: -6, background: "var(--saffron)", color: "var(--ink)", borderRadius: 999, fontSize: 11, fontWeight: 700, padding: "1px 6px" }}>{newCount}</span>
          )}
        </Link>
      </div>
      {open && <div className="side-back" onClick={() => setOpen(false)} />}
      {side}
      <main className="main">
        <Banners />
        {children}
      </main>
    </div>
  );
}

function Banners() {
  const { d } = useApp();
  const { my, tenant, isOwner, base } = useStore();
  const pathname = usePathname();
  const out: React.ReactNode[] = [];
  if (my.access === "suspended") out.push(<div key="s" className="banner err">{d.admin.banner.suspended}</div>);
  else if (my.access === "expired")
    out.push(
      <div key="e" className="banner err">
        <span>{d.admin.banner.expired}</span>
        {isOwner && <Link href={`${base}/subscription`} className="btn btn-ink btn-xs">{d.admin.banner.choosePlan}</Link>}
      </div>,
    );
  else if (my.access === "grace")
    out.push(
      <div key="g" className="banner warn">
        <span>{d.admin.banner.grace}</span>
        {isOwner && <Link href={`${base}/subscription`} className="btn btn-ink btn-xs">{d.admin.banner.choosePlan}</Link>}
      </div>,
    );
  if (tenant.launched_at && tenant.paused_at)
    out.push(
      <div key="p" className="banner warn">
        <span>{d.settings.danger.paused}</span>
        {isOwner && <Link href={`${base}/settings?tab=store`} className="btn btn-ink btn-xs">{d.settings.danger.resumeBtn}</Link>}
      </div>,
    );
  if (!tenant.launched_at && isOwner && !pathname.endsWith("/setup"))
    out.push(
      <div key="l" className="banner info">
        <span>{d.admin.banner.notLaunched}</span>
        <Link href={`${base}/setup`} className="btn btn-primary btn-xs">{d.admin.banner.finishSetup}</Link>
      </div>,
    );
  return <>{out}</>;
}

export function PageHead({ title, sub, children }: { title: string; sub?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="page-head">
      <div>
        <h1>{title}</h1>
        {sub && <div className="sub">{sub}</div>}
      </div>
      {children && <div className="row">{children}</div>}
    </div>
  );
}

/** Pages the backend allows only for the owner: staff see a short note instead. */
export function OwnerOnly({ note, children }: { note: string; children: React.ReactNode }) {
  const { isOwner } = useStore();
  if (!isOwner) return <div className="note note-info">{note}</div>;
  return <>{children}</>;
}
