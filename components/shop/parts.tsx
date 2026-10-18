"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { money, prettyPhone, TZ } from "@/lib/format";
import { fmt, type Lang } from "@/lib/i18n";
import type { BookCard as BookCardT, DayHours, StorefrontItemOut } from "@/lib/types";
import { useApp } from "../app";
import { BookCover } from "../book-cover";
import { ICart, ICheck, IClock, IInstagram, IOrders, IPhone, IPin, ISearch, ITelegram } from "../icons";
import { LangSwitch } from "../ui";
import { useShop } from "./shop";

export function todayKey(): string {
  return new Date().toLocaleDateString("en-US", { weekday: "short", timeZone: TZ }).slice(0, 3).toLowerCase();
}

function hhmm(t: string) {
  return t.slice(0, 5);
}

export function StoreAvatar({ size = 42 }: { size?: number }) {
  const { store } = useShop();
  const logo = store.logo?.s ?? store.logo?.l;
  return (
    <span className="av" style={{ width: size, height: size }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {logo ? <img src={logo} alt="" /> : store.name.slice(0, 1).toUpperCase()}
    </span>
  );
}

function SearchBox({ mobile = false }: { mobile?: boolean }) {
  const { d } = useApp();
  const { href } = useShop();
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  useEffect(() => setQ(params.get("q") ?? ""), [params]);
  return (
    <form
      role="search"
      className={mobile ? "sf-search sf-search-m" : "sf-search"}
      onSubmit={(e) => {
        e.preventDefault();
        const next = new URLSearchParams();
        if (q.trim()) next.set("q", q.trim());
        router.push(`${href("/")}${next.toString() ? `?${next}` : ""}`);
      }}
    >
      <ISearch size={18} />
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={d.shop.searchPh} aria-label={d.common.search} maxLength={100} />
    </form>
  );
}

export function ShopHeader() {
  const { d } = useApp();
  const { store, href, cartCount, orders, inTelegram } = useShop();
  const hours = store.working_hours?.[todayKey()] as DayHours | null | undefined;
  return (
    <>
      {!inTelegram && (
        <div className="sf-top">
          <div className="container">
            <span className="row" style={{ gap: 14 }}>
              {store.working_hours && (
                <span className="row" style={{ gap: 6 }}>
                  <IClock size={15} />
                  {hours ? fmt(d.shop.openToday, { open: hhmm(hours.open), close: hhmm(hours.close) }) : d.shop.closedToday}
                </span>
              )}
              {store.address && (
                <span className="row" style={{ gap: 6 }}>
                  <IPin size={15} /> {store.address}
                </span>
              )}
            </span>
            <LangSwitch only={store.languages as Lang[]} />
          </div>
        </div>
      )}
      <header className="sf-head">
        <div className="container">
          <Link href={href("/")} className="sf-brand">
            <StoreAvatar />
            <strong>{store.name}</strong>
          </Link>
          <Suspense>
            <SearchBox />
          </Suspense>
          <div className="row" style={{ gap: 8, marginLeft: "auto", flexWrap: "nowrap" }}>
            {inTelegram && <LangSwitch only={store.languages as Lang[]} />}
            {orders.length > 0 && (
              <Link href={href("/buyurtmalarim")} className="hbtn hbtn-o" aria-label={d.shop.myOrders} title={d.shop.myOrders} style={{ padding: "0 14px" }}>
                <IOrders size={18} />
              </Link>
            )}
            {!inTelegram && store.telegram_username && (
              <a href={`https://t.me/${store.telegram_username}`} target="_blank" rel="noreferrer" className="hbtn hbtn-o" aria-label="Telegram" style={{ padding: "0 14px" }}>
                <ITelegram size={18} />
              </a>
            )}
            <Link href={href("/savat")} className="hbtn hbtn-f">
              <ICart size={18} />
              <span className="hide-xs">{d.shop.cart}</span>
              {cartCount > 0 && <span className="cnt">{cartCount}</span>}
            </Link>
          </div>
        </div>
      </header>
    </>
  );
}

export function MobileSearch() {
  return (
    <Suspense>
      <SearchBox mobile />
    </Suspense>
  );
}

export function ShopFooter({ appUrl }: { appUrl: string }) {
  const { d } = useApp();
  const { store } = useShop();
  const map =
    store.latitude != null && store.longitude != null
      ? `https://yandex.uz/maps/?pt=${store.longitude},${store.latitude}&z=17&l=map`
      : null;
  const days = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
  const wh = store.working_hours;
  return (
    <footer className="sf-foot">
      <div className="container grid-2" style={{ alignItems: "start", gap: 28 }}>
        <div className="stack-sm">
          <h2 className="sf-h" style={{ fontSize: 26, fontWeight: 600, marginBottom: 8 }}>{d.shop.visitUs}</h2>
          {store.address && (
            <a className="info-row" href={map ?? undefined} target={map ? "_blank" : undefined} rel="noreferrer">
              <IPin size={18} /> <span>{store.address}</span>
            </a>
          )}
          {store.phone && (
            <a className="info-row" href={`tel:${store.phone}`}>
              <IPhone size={18} /> <span>{prettyPhone(store.phone)}</span>
            </a>
          )}
          {store.telegram_username && (
            <a className="info-row" href={`https://t.me/${store.telegram_username}`} target="_blank" rel="noreferrer">
              <ITelegram size={18} /> <span>@{store.telegram_username}</span>
            </a>
          )}
          {store.instagram_username && (
            <a className="info-row" href={`https://instagram.com/${store.instagram_username}`} target="_blank" rel="noreferrer">
              <IInstagram size={18} /> <span>@{store.instagram_username}</span>
            </a>
          )}
          <div className="row" style={{ gap: 10, marginTop: 8 }}>
            {map && (
              <a href={map} target="_blank" rel="noreferrer" className="hbtn" style={{ background: "var(--s-head-fg)", color: "var(--s-head)" }}>
                <IPin size={16} /> {d.shop.openMap}
              </a>
            )}
            {store.phone && (
              <a href={`tel:${store.phone}`} className="hbtn" style={{ border: "1.5px solid currentColor" }}>
                <IPhone size={16} /> {d.shop.call}
              </a>
            )}
          </div>
        </div>
        {wh && (
          <div className="stack-sm">
            <strong style={{ opacity: 0.8 }}>{d.shop.hours}</strong>
            {days.map((day) => {
              const h = wh[day];
              if (h === undefined) return null;
              return (
                <div key={day} className="row-between small" style={{ maxWidth: 320, fontWeight: day === todayKey() ? 700 : 400 }}>
                  <span>{d.enums.weekday[day]}</span>
                  <span>{h ? `${hhmm(h.open)}–${hhmm(h.close)}` : d.settings.closed}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <div className="container row-between xs" style={{ marginTop: 28, opacity: 0.7 }}>
        <span>
          © {new Date().getFullYear()} {store.name}
        </span>
        <a href={appUrl} target="_blank" rel="noreferrer">
          {d.shop.madeWith}
        </a>
      </div>
    </footer>
  );
}

export function authorsText(book: Pick<BookCardT, "authors">): string {
  return book.authors.map((a) => a.name).join(", ");
}

export function AddToCartButton({ item, className = "addbtn", qty = 1, label }: { item: StorefrontItemOut; className?: string; qty?: number; label?: React.ReactNode }) {
  const { d } = useApp();
  const { cart, add, href } = useShop();
  const router = useRouter();
  const inCart = cart.some((l) => l.book_id === item.book.id);
  if (!item.in_stock) {
    return (
      <button className={className} disabled>
        {d.shop.outOfStock}
      </button>
    );
  }
  if (inCart && qty === 1 && !label) {
    return (
      <button className={`${className} in`} onClick={() => router.push(href("/savat"))}>
        <ICheck size={16} /> {d.shop.inCart}
      </button>
    );
  }
  return (
    <button
      className={className}
      onClick={() =>
        add(
          {
            book_id: item.book.id,
            title: item.book.title,
            authors: authorsText(item.book),
            cover: item.book.cover?.s ?? item.book.cover?.m ?? null,
            price: item.price,
          },
          qty,
        )
      }
    >
      {label ?? (
        <>
          <ICart size={16} /> {d.shop.addToCart}
        </>
      )}
    </button>
  );
}

export function BookCard({ item }: { item: StorefrontItemOut }) {
  const { d, lang } = useApp();
  const { href } = useShop();
  const b = item.book;
  const url = href(`/kitob/${b.id}`);
  return (
    <article className="book">
      <Link href={url} className="cover-link" aria-label={b.title}>
        <BookCover title={b.title} authors={b.authors} cover={b.cover} size="m" />
      </Link>
      <div className="stack-sm" style={{ gap: 3 }}>
        <Link href={url} className="bt">
          {b.title}
        </Link>
        <span className="au">{authorsText(b)}</span>
      </div>
      <div className="pr">
        <strong>{money(item.price, lang)}</strong>
        <span className={`stock ${item.in_stock ? "" : "out"}`}>
          <span className="dot" />
          {item.in_stock ? d.shop.inStock : d.shop.outOfStock}
        </span>
      </div>
      <AddToCartButton item={item} />
    </article>
  );
}

export function StickyCart() {
  const { d, lang } = useApp();
  const { cart, cartCount, href } = useShop();
  const pathname = usePathname();
  // The book page has its own bottom bar; the cart and order pages need none.
  if (!cartCount || /\/(kitob|savat|buyurtma)/.test(pathname)) return null;
  const total = cart.reduce((s, l) => s + l.price * l.quantity, 0);
  return (
    <div className="sticky-cart">
      <Link href={href("/savat")} className="cta-wide" style={{ textDecoration: "none" }}>
        <span className="row" style={{ gap: 8 }}>
          <ICart size={18} /> {d.shop.cart} · {cartCount}
        </span>
        <span>{money(total, lang)}</span>
      </Link>
    </div>
  );
}
