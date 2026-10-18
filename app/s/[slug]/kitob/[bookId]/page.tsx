import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookCover } from "@/components/book-cover";
import { IBack } from "@/components/icons";
import { BuyBox, ShareButton } from "@/components/shop/buy-box";
import { money, prettyIsbn } from "@/lib/format";
import { fmt } from "@/lib/i18n";
import { serverGetOrNull } from "@/lib/server-api";
import { shopContext } from "@/lib/shop-server";
import type { StorefrontItemPageOut } from "@/lib/types";

type Props = { params: Promise<{ slug: string; bookId: string }> };

async function load(slug: string, bookId: string, lang: string) {
  if (!/^\d{1,18}$/.test(bookId)) return null;
  return serverGetOrNull<StorefrontItemPageOut>(`/storefront/${slug}/books/${bookId}`, lang);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, bookId } = await params;
  const { store, lang, d, origin, base } = await shopContext(slug);
  if (!store) return {};
  const item = await load(slug, bookId, lang);
  if (!item) return { title: d.common.notFoundTitle, robots: { index: false } };
  const b = item.book;
  const authors = b.authors.map((a) => a.name).join(", ");
  const description = [
    money(item.price, lang),
    item.in_stock ? d.shop.inStock : d.shop.outOfStock,
    d.enums.bookLanguage[b.language],
    d.enums.bookScript[b.script],
    b.description?.slice(0, 140),
  ]
    .filter(Boolean)
    .join(" · ");
  return {
    title: authors ? `${b.title} — ${authors}` : b.title,
    description,
    alternates: { canonical: `${origin}${base}/kitob/${b.id}` },
    openGraph: { title: b.title, description, images: b.cover?.l ? [b.cover.l] : undefined, type: "website" },
  };
}

export default async function BookPage({ params }: Props) {
  const { slug, bookId } = await params;
  const { store, lang, d, base } = await shopContext(slug);
  if (!store) return null;
  const item = await load(slug, bookId, lang);
  if (!item) notFound();
  const href = (p: string) => (base ? `${base}${p === "/" ? "" : p}` : p);
  const b = item.book;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Book",
    name: b.title,
    author: b.authors.map((a) => ({ "@type": "Person", name: a.name })),
    isbn: b.isbn13 ?? undefined,
    image: b.cover?.l ?? undefined,
    publisher: b.publisher ? { "@type": "Organization", name: b.publisher.name } : undefined,
    numberOfPages: b.pages ?? undefined,
    inLanguage: b.language !== "other" ? b.language : undefined,
    offers: {
      "@type": "Offer",
      price: (item.price / 100).toFixed(0),
      priceCurrency: "UZS",
      availability: item.in_stock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      seller: { "@type": "Organization", name: store.name },
    },
  };

  return (
    <div className="container" style={{ paddingBottom: 90 }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Link href={href("/")} className="row" style={{ gap: 6, marginBottom: 16, textDecoration: "none", fontWeight: 600 }}>
        <IBack size={16} /> {d.shop.back}
      </Link>
      <div className="sf-book">
        <div className="stage">
          <BookCover title={b.title} authors={b.authors} cover={b.cover} size="l" className="big-cover" />
        </div>
        <div className="stack" style={{ gap: 16 }}>
          <div className="chips">
            <span className="chip" style={{ cursor: "default" }}>
              {d.enums.bookLanguage[b.language]} · {d.enums.bookScript[b.script]}
            </span>
            {b.published_year && <span className="chip" style={{ cursor: "default" }}>{b.published_year}</span>}
          </div>
          <div>
            <h1 className="sf-h" style={{ fontSize: "clamp(30px, 4vw, 42px)", fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.05 }}>{b.title}</h1>
            {b.subtitle && <p className="muted" style={{ fontSize: 18, marginTop: 6 }}>{b.subtitle}</p>}
          </div>
          {b.authors.length > 0 && (
            <div className="row" style={{ gap: 10 }}>
              {b.authors.map((a) => (
                <Link key={a.id} href={`${href("/")}?author_id=${a.id}`} style={{ fontWeight: 600, fontSize: 16 }}>
                  {a.name}
                </Link>
              ))}
            </div>
          )}
          <div className="row-between" style={{ maxWidth: 520 }}>
            <strong style={{ fontSize: 28, letterSpacing: "-0.01em" }}>{money(item.price, lang)}</strong>
            <span className={`stock ${item.in_stock ? "" : "out"}`} style={{ fontSize: 14 }}>
              <span className="dot" />
              {item.in_stock ? d.shop.inStock : d.shop.outOfStock}
            </span>
          </div>
          <div style={{ maxWidth: 520 }}>
            <BuyBox item={item} />
          </div>
          {(store.pickup_enabled || store.delivery_enabled) && (
            <div className="note small" style={{ maxWidth: 520 }}>
              {store.delivery_enabled && (
                <div>
                  {d.shop.delivery}: {store.delivery_fee ? money(store.delivery_fee, lang) : d.shop.free}
                  {store.free_delivery_from ? ` · ${fmt(d.shop.freeFrom, { sum: money(store.free_delivery_from, lang) })}` : ""}
                </div>
              )}
              {store.pickup_enabled && <div>{d.shop.pickup}{store.address ? `: ${store.address}` : ""}</div>}
            </div>
          )}
          {b.description && <p style={{ fontSize: 16, lineHeight: 1.65, whiteSpace: "pre-line", maxWidth: 680 }}>{b.description}</p>}
          <div className="card" style={{ maxWidth: 680 }}>
            <h2 style={{ fontSize: 16, marginBottom: 12 }}>{d.shop.details}</h2>
            <dl className="kv" style={{ margin: 0 }}>
              {b.isbn13 && (
                <>
                  <dt>{d.shop.isbn}</dt>
                  <dd className="mono">{prettyIsbn(b.isbn13)}</dd>
                </>
              )}
              {b.publisher && (
                <>
                  <dt>{d.shop.publisher}</dt>
                  <dd>
                    <Link href={`${href("/")}?publisher_id=${b.publisher.id}`}>{b.publisher.name}</Link>
                  </dd>
                </>
              )}
              {b.published_year && (
                <>
                  <dt>{d.shop.year}</dt>
                  <dd>{b.published_year}</dd>
                </>
              )}
              {b.pages && (
                <>
                  <dt>{d.shop.pages}</dt>
                  <dd>{b.pages}</dd>
                </>
              )}
              <dt>{d.shop.language}</dt>
              <dd>
                {d.enums.bookLanguage[b.language]} · {d.enums.bookScript[b.script]}
              </dd>
            </dl>
          </div>
          <div>
            <ShareButton title={b.title} />
          </div>
        </div>
      </div>
      {item.similar && item.similar.length > 0 && (
        <section style={{ marginTop: 40 }}>
          <h2 className="sf-h" style={{ fontSize: 22, fontWeight: 600 }}>{d.shop.similar}</h2>
          <div className="sim-row">
            {item.similar.map((s) => (
              <Link key={s.book.id} href={href(`/kitob/${s.book.id}`)} className="sim">
                <BookCover title={s.book.title} authors={s.book.authors} cover={s.book.cover} size="s" />
                <strong style={{ fontSize: 13, lineHeight: 1.25 }}>{s.book.title}</strong>
                <span style={{ fontSize: 13 }}>{money(s.price, lang)}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
