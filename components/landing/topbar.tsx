import Link from "next/link";
import type { Dict } from "@/lib/i18n";
import { LangSwitch, Logo } from "../ui";
import { AuthButtons } from "./auth-buttons";

export function Topbar({ d, dark = false, links = true }: { d: Dict; dark?: boolean; links?: boolean }) {
  return (
    <header className={`topbar ${dark ? "dark" : ""}`}>
      <Logo dark={dark} />
      {links && (
        <nav aria-label="main">
          <Link className="nl" href="/#qanday">{d.nav.how}</Link>
          <Link className="nl" href="/#imkoniyatlar">{d.nav.features}</Link>
          <Link className="nl" href="/#narxlar">{d.nav.pricing}</Link>
          <Link className="nl" href="/#savollar">{d.nav.faq}</Link>
        </nav>
      )}
      <div className="row" style={{ gap: 14 }}>
        <LangSwitch />
        <AuthButtons dark={dark} />
      </div>
    </header>
  );
}

export function Footer({ d, support }: { d: Dict; support: string | null }) {
  return (
    <footer className="foot">
      <div className="container row-between">
        <span>{d.landing.footer.replace("{year}", String(new Date().getFullYear()))}</span>
        <div className="row" style={{ gap: 20 }}>
          <Link href="/#narxlar">{d.nav.pricing}</Link>
          <Link href="/#savollar">{d.nav.faq}</Link>
          {support && (
            <a href={`https://t.me/${support}`} target="_blank" rel="noreferrer">
              {d.common.help}
            </a>
          )}
        </div>
      </div>
    </footer>
  );
}
