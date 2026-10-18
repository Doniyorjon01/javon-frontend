"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { groupDigits, somNumber } from "@/lib/format";
import type { FacetsOut } from "@/lib/types";
import { useApp } from "../app";
import { IFilter, IX } from "../icons";
import { useShop } from "./shop";

/** Filters live in the URL, so a filtered shelf can be shared and indexed. */
function useUrlState() {
  const router = useRouter();
  const params = useSearchParams();
  const { href } = useShop();
  const set = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === "") next.delete(k);
      else next.set(k, v);
    }
    next.delete("page");
    const s = next.toString();
    router.push(`${href("/")}${s ? `?${s}` : ""}`, { scroll: false });
  };
  return { params, set };
}

export function Filters({ facets }: { facets: FacetsOut }) {
  const { d } = useApp();
  const { params, set } = useUrlState();
  const [open, setOpen] = useState(false);
  const [showAllAuthors, setShowAllAuthors] = useState(false);
  const [min, setMin] = useState(params.get("min_price") ?? "");
  const [max, setMax] = useState(params.get("max_price") ?? "");
  useEffect(() => {
    setMin(params.get("min_price") ?? "");
    setMax(params.get("max_price") ?? "");
  }, [params]);

  const active = ["language", "script", "author_id", "publisher_id", "min_price", "max_price", "in_stock"].some((k) => params.get(k));
  const authors = showAllAuthors ? facets.authors : facets.authors.slice(0, 8);

  const panel = (
    <div className={`sf-filters ${open ? "sheet" : ""}`}>
      {facets.languages.length > 1 && (
        <section>
          <h3>{d.shop.language}</h3>
          <div className="chips">
            {facets.languages.map((f) => {
              const on = params.get("language") === f.value;
              return (
                <button key={f.value} className={`chip ${on ? "on" : ""}`} aria-pressed={on} onClick={() => set({ language: on ? null : f.value })}>
                  {d.enums.bookLanguage[f.value as keyof typeof d.enums.bookLanguage] ?? f.value}
                  <span className="n">{f.count}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}
      {facets.scripts.length > 1 && (
        <section>
          <h3>{d.shop.script}</h3>
          <div className="chips">
            {facets.scripts.map((f) => {
              const on = params.get("script") === f.value;
              return (
                <button key={f.value} className={`chip ${on ? "on" : ""}`} aria-pressed={on} onClick={() => set({ script: on ? null : f.value })}>
                  {d.enums.bookScript[f.value as keyof typeof d.enums.bookScript] ?? f.value}
                  <span className="n">{f.count}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}
      {facets.authors.length > 0 && (
        <section>
          <h3>{d.shop.author}</h3>
          <div className="stack-sm" style={{ gap: 0 }}>
            {authors.map((a) => {
              const on = params.get("author_id") === String(a.id);
              return (
                <label key={a.id} className="check">
                  <input type="checkbox" checked={on} onChange={() => set({ author_id: on ? null : String(a.id) })} />
                  <span className="grow">{a.name}</span>
                  <span className="muted xs">{a.count}</span>
                </label>
              );
            })}
            {facets.authors.length > 8 && !showAllAuthors && (
              <button className="btn-link small" style={{ alignSelf: "flex-start", color: "inherit" }} onClick={() => setShowAllAuthors(true)}>
                {d.common.showMore}
              </button>
            )}
          </div>
        </section>
      )}
      {facets.publishers.length > 0 && (
        <section>
          <h3>{d.shop.publisher}</h3>
          <select
            className="inp"
            value={params.get("publisher_id") ?? ""}
            onChange={(e) => set({ publisher_id: e.target.value || null })}
            aria-label={d.shop.publisher}
          >
            <option value="">{d.common.all}</option>
            {facets.publishers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.count})
              </option>
            ))}
          </select>
        </section>
      )}
      {facets.price_min !== null && facets.price_max !== null && facets.price_max > facets.price_min && (
        <section>
          <h3>{d.shop.price}</h3>
          <form
            className="stack-sm"
            onSubmit={(e) => {
              e.preventDefault();
              set({ min_price: min.replace(/\D/g, "") || null, max_price: max.replace(/\D/g, "") || null });
            }}
          >
            <div className="row" style={{ gap: 8, flexWrap: "nowrap" }}>
              <input className="inp" inputMode="numeric" value={groupDigits(min)} onChange={(e) => setMin(e.target.value)} placeholder={somNumber(facets.price_min)} aria-label={d.common.from} />
              <span>—</span>
              <input className="inp" inputMode="numeric" value={groupDigits(max)} onChange={(e) => setMax(e.target.value)} placeholder={somNumber(facets.price_max)} aria-label={d.common.to} />
            </div>
            <button className="hbtn hbtn-o" style={{ minHeight: 40 }}>
              {d.shop.apply}
            </button>
          </form>
        </section>
      )}
      <label className="check">
        <input type="checkbox" checked={params.get("in_stock") === "1"} onChange={(e) => set({ in_stock: e.target.checked ? "1" : null })} />
        {d.shop.onlyInStock}
      </label>
      {active && (
        <button
          className="btn-link small"
          style={{ alignSelf: "flex-start", color: "inherit" }}
          onClick={() => set({ language: null, script: null, author_id: null, publisher_id: null, min_price: null, max_price: null, in_stock: null })}
        >
          <IX size={14} /> {d.shop.reset}
        </button>
      )}
    </div>
  );

  return (
    <>
      <div className="mobile-only" style={{ marginBottom: 12 }}>
        <button className="hbtn hbtn-o" onClick={() => setOpen(!open)} aria-expanded={open}>
          <IFilter size={16} /> {d.shop.filters}
          {active && <span className="cnt" style={{ background: "var(--s-accent)", color: "var(--s-accent-fg)" }}>•</span>}
        </button>
        {open && <div className="card" style={{ marginTop: 12 }}>{panel}</div>}
      </div>
      <div className="desktop-only">{panel}</div>
    </>
  );
}

export function SortSelect() {
  const { d } = useApp();
  const { params, set } = useUrlState();
  const q = params.get("q");
  return (
    <select
      className="inp"
      style={{ width: "auto", minHeight: 42 }}
      value={params.get("sort") ?? (q ? "relevance" : "new")}
      onChange={(e) => set({ sort: e.target.value })}
      aria-label={d.shop.sort}
    >
      {q && <option value="relevance">{d.shop.sortRelevance}</option>}
      <option value="new">{d.shop.sortNew}</option>
      <option value="price_asc">{d.shop.sortPriceAsc}</option>
      <option value="price_desc">{d.shop.sortPriceDesc}</option>
      <option value="title">{d.shop.sortTitle}</option>
    </select>
  );
}
