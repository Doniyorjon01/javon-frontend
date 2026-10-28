"use client";

import { useState } from "react";
import { money } from "@/lib/format";
import type { StorefrontItemOut } from "@/lib/types";
import { useApp } from "../app";
import { IMinus, IPlus } from "../icons";
import { AddToCartButton } from "./parts";
import { useShop } from "./shop";

export function BuyBox({ item }: { item: StorefrontItemOut }) {
  const { d, lang } = useApp();
  const { cart } = useShop();
  const [qty, setQty] = useState(1);
  const inCart = cart.find((l) => l.book_id === item.book.id)?.quantity ?? 0;
  return (
    <div className="mini-bottom">
      {item.in_stock && (
        <div className="stp" role="group" aria-label={d.shop.qty}>
          <button type="button" onClick={() => setQty(Math.max(1, qty - 1))} disabled={qty <= 1} aria-label="-1">
            <IMinus size={16} />
          </button>
          <span>{qty}</span>
          <button type="button" onClick={() => setQty(Math.min(99, qty + 1))} aria-label="+1">
            <IPlus size={16} />
          </button>
        </div>
      )}
      <AddToCartButton
        item={item}
        qty={qty}
        className="cta-wide"
        label={
          <>
            <span className="cta-label">
              {d.shop.addToCart}
              {inCart > 0 && <small>{d.shop.inCart}: {inCart}</small>}
            </span>
            <span className="nowrap">{money(item.price * qty, lang)}</span>
          </>
        }
      />
    </div>
  );
}

export function ShareButton({ title }: { title: string }) {
  const { d, toast } = useApp();
  return (
    <button
      type="button"
      className="hbtn hbtn-o"
      style={{ minHeight: 40 }}
      onClick={async () => {
        const url = location.href.split("#")[0];
        try {
          if (navigator.share) await navigator.share({ title, url });
          else {
            await navigator.clipboard.writeText(url);
            toast(d.common.copied, "ok");
          }
        } catch {
          /* cancelled */
        }
      }}
    >
      {d.shop.share}
    </button>
  );
}
