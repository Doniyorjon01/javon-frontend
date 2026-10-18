import Link from "next/link";
import { BookCover } from "@/components/book-cover";
import { IArrow } from "@/components/icons";
import { Filters, SortSelect } from "@/components/shop/filters";
import { BookCard, MobileSearch } from "@/components/shop/parts";
import { money } from "@/lib/format";
import { fmt } from "@/lib/i18n";
import { serverGet } from "@/lib/server-api";
import { shopContext } from "@/lib/shop-server";
import type { FacetsOut, Page, StorefrontItemOut } from "@/lib/types";

type SP = Record<string, string | string[] | undefined>;

function one(sp: SP, k: string): string | null {
  const v = sp[k];
  const s = Array.isArray(v) ? v[0] : v;
  return s && s.trim() ? s.trim() : null;
}
function intParam(sp: SP, k: string): number | null {
  const s = one(sp, k);
  return s && /^\d{1,12}$/.test(s) ? Number(s) : null;
}

export default async function Catalog({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<SP> }) {
  const { slug } = await params;
  const sp = await searchParams;
  const { store, lang, d, base } = await shopContext(slug);
  if (!store) return null;
  const href = (p: string) => (base ? `${base}${p === "/" ? "" : p}` : p);

  const q = one(sp, "q");
  const page = Math.max(1, intParam(sp, "page") ?? 1);
  const minSom = intParam(sp, "min_price");
  const maxSom = intParam(sp, "max_price");
  const sortParam = one(sp, "sort");
  const sort = ["relevance", "new", "price_asc", "price_desc", "title"].includes(sortParam ?? "") ? sortParam : null;
  const query = {
    q,
    language: one(sp, "language"),
    script: one(sp, "script"),
    author_id: intParam(sp, "author_id"),
    publisher_id: intParam(sp, "publisher_id"),
    min_price: minSom !== null ? minSom * 100 : null,
    max_price: maxSom !== null ? maxSom * 100 : null,
    in_stock: one(sp, "in_stock") === "1" ? true : null,
    sort: sort === "relevance" && !q ? null : sort,
    page,
    size: 24,
  };
  const filtered = Object.entries(query).some(([k, v]) => !["page", "size", "sort"].includes(k) && v !== null);

  const [books, facets] = await Promise.all([
    serverGet<Page<StorefrontItemOut>>(`/storefront/${slug}/books`, lang, query).catch(() => null),
    serverGet<FacetsOut>(`/storefront/${slug}/facets`, lang).catch(() => null),
  ]);
  const showHero = !filtered && page === 1 && !!books && books.items.length > 0;

  const pageLink = (p: number) => {
    const next = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) if (typeof v === "string" && k !== "page") next.set(k, v);
    if (p > 1) next.set("page", String(p));
    const s = next.toString();
    return `${href("/")}${s ? `?${s}` : ""}`;
  };

  const deliveryLine = [
    store.pickup_enabled ? d.shop.pickup : null,
    store.delivery_enabled
      ? `${d.shop.delivery}${store.delivery_area ? ` (${store.delivery_area})` : ""}${
          store.free_delivery_from ? ` · ${fmt(d.shop.freeFrom, { sum: money(store.free_delivery_from, lang) })}` : ""
        }`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="container">
      <MobileSearch />
      {showHero && books && (
        <section className="sf-hero">
          <div className="stack" style={{ gap: 14 }}>
            <span className="eyebrow" style={{ color: "var(--s-muted)" }}>{store.name}</span>
            <h1>{d.shop.newArrivals}</h1>
            {deliveryLine && <p className="muted" style={{ fontSize: 16 }}>{deliveryLine}</p>}
            <a href="#katalog" className="hbtn hbtn-f" style={{ alignSelf: "flex-start" }}>
              {d.shop.catalog} <IArrow size={16} />
            </a>
          </div>
          <div className="sf-shelf" aria-hidden="true">
            {books.items.slice(0, 6).map((it, i) => (
              <Link key={it.book.id} href={href(`/kitob/${it.book.id}`)} className={`shelf-cover ${i === 2 ? "tilt" : ""}`} tabIndex={-1}>
                <BookCover title={it.book.title} authors={it.book.authors} cover={it.book.cover} size="s" />
              </Link>
            ))}
          </div>
        </section>
      )}
      <div className="sf-layout" id="katalog">
        {facets && facets.total > 0 ? <Filters facets={facets} /> : <div />}
        <section className="stack" style={{ gap: 18 }}>
          <div className="row-between">
            <h2 className="sf-h" style={{ fontSize: 26, fontWeight: 600 }}>
              {q ? `«${q}»` : d.shop.catalog}{" "}
              {books && <span className="muted" style={{ fontSize: 15, fontWeight: 500, fontFamily: "var(--f-sans)" }}>· {fmt(d.shop.booksCount, { n: books.total })}</span>}
            </h2>
            <SortSelect />
          </div>
          {!books ? (
            <div className="note">{d.common.errorLoad}</div>
          ) : books.items.length === 0 ? (
            <div className="empty">
              <strong>{d.shop.noResults}</strong>
              {filtered && (
                <Link href={href("/")} className="hbtn hbtn-o">
                  {d.shop.reset}
                </Link>
              )}
            </div>
          ) : (
            <div className="sf-grid">
              {books.items.map((it) => (
                <BookCard key={it.book.id} item={it} />
              ))}
            </div>
          )}
          {books && books.pages > 1 && (
            <nav className="pager" aria-label="pagination">
              {page > 1 && (
                <Link className="hbtn hbtn-o" href={pageLink(page - 1)}>
                  {d.common.prev}
                </Link>
              )}
              <span>{fmt(d.common.pageOf, { page, pages: books.pages })}</span>
              {page < books.pages && (
                <Link className="hbtn hbtn-o" href={pageLink(page + 1)}>
                  {d.common.nextPage}
                </Link>
              )}
            </nav>
          )}
        </section>
      </div>
    </div>
  );
}
