"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useApp } from "@/components/app";
import { InventoryRow } from "@/components/admin/inventory-row";
import { PageHead } from "@/components/admin/shell";
import { useStore } from "@/components/admin/store";
import { IPlus, ISearch, IShelf, IUpload } from "@/components/icons";
import { Empty, ErrorBox, Loading, Pager } from "@/components/ui";
import { fmt } from "@/lib/i18n";
import { useApi, useDebounced } from "@/lib/hooks";
import type { InventoryItemOut, Page, SubscriptionOut } from "@/lib/types";

type Filter = "all" | "in" | "out" | "hidden";

function BooksInner() {
  const { d } = useApp();
  const { id, base, isOwner } = useStore();
  const params = useSearchParams();
  const [filter, setFilter] = useState<Filter>((params.get("filter") as Filter) || "all");
  const [sort, setSort] = useState<"updated" | "title" | "quantity">("updated");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const dq = useDebounced(q.trim(), 350);
  useEffect(() => setPage(1), [filter, sort, dq]);

  const { data, setData, error, loading, reload } = useApi<Page<InventoryItemOut>>(`/tenants/${id}/inventory`, {
    q: dq || null,
    in_stock: filter === "in" ? true : filter === "out" ? false : null,
    visible: filter === "hidden" ? false : null,
    sort,
    page,
    size: 25,
  });
  const sub = useApi<SubscriptionOut>(isOwner ? `/tenants/${id}/subscription` : null);

  const replace = (item: InventoryItemOut) =>
    data && setData({ ...data, items: data.items.map((x) => (x.id === item.id ? item : x)) });
  const removed = (itemId: number) =>
    data && setData({ ...data, items: data.items.filter((x) => x.id !== itemId), total: data.total - 1 });

  return (
    <>
      <PageHead
        title={d.books.title}
        sub={
          sub.data
            ? fmt(d.books.planLimit, { used: sub.data.items_used, limit: sub.data.item_limit ?? "∞" })
            : data
              ? fmt(d.common.totalCount, { n: data.total })
              : undefined
        }
      >
        {isOwner && (
          <>
            <Link href={`${base}/books/import`} className="btn btn-soft btn-sm">
              <IUpload size={16} /> {d.admin.nav.import}
            </Link>
            <Link href={`${base}/books/add`} className="btn btn-primary btn-sm">
              <IPlus size={16} /> {d.books.addBtn}
            </Link>
          </>
        )}
      </PageHead>
      {!isOwner && <div className="note note-info small" style={{ marginBottom: 14 }}>{d.books.staffNote}</div>}
      <div className="row-between" style={{ marginBottom: 14 }}>
        <div className="tabs">
          {(
            [
              ["all", d.books.filterAll],
              ["in", d.books.filterInStock],
              ["out", d.books.filterOut],
              ["hidden", d.books.filterHidden],
            ] as Array<[Filter, string]>
          ).map(([k, label]) => (
            <button key={k} className={`tab ${filter === k ? "on" : ""}`} onClick={() => setFilter(k)}>
              {label}
            </button>
          ))}
        </div>
        <div className="row" style={{ flex: "1 1 320px", justifyContent: "flex-end" }}>
          <div className="inp-wrap" style={{ minHeight: 42, flex: "1 1 200px", maxWidth: 320 }}>
            <ISearch size={18} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={d.books.searchPh} aria-label={d.common.search} style={{ fontWeight: 500, fontSize: 15 }} />
          </div>
          <select className="inp" style={{ width: "auto", minHeight: 42 }} value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} aria-label={d.books.sort}>
            <option value="updated">{d.books.sortUpdated}</option>
            <option value="title">{d.books.sortTitle}</option>
            <option value="quantity">{d.books.sortQty}</option>
          </select>
        </div>
      </div>
      <ErrorBox error={error} onRetry={reload} />
      {!data && loading ? (
        <Loading />
      ) : data && data.items.length === 0 ? (
        <div className="card">
          <Empty icon={<IShelf />} title={d.books.empty} text={isOwner ? d.books.emptyText : undefined}>
            {isOwner && (
              <Link href={`${base}/books/add`} className="btn btn-primary btn-sm">
                <IPlus size={16} /> {d.books.addBtn}
              </Link>
            )}
          </Empty>
        </div>
      ) : (
        <div className="stack-sm" style={{ gap: 10 }}>
          {data?.items.map((item) => (
            <InventoryRow key={item.id} item={item} onChange={replace} onRemoved={removed} />
          ))}
        </div>
      )}
      {data && <Pager page={data.page} pages={data.pages} onPage={setPage} />}
    </>
  );
}

export default function BooksPage() {
  return (
    <Suspense>
      <BooksInner />
    </Suspense>
  );
}
