"use client";

/**
 * Storefront state: the store, its address (path prefix), the cart and the
 * buyer's own orders (kept in this browser), and the Telegram Mini App.
 *
 * Inside the store's Mini App Telegram passes signed init data; we send it as
 * X-Telegram-Init-Data so the backend links orders to the buyer's chat
 * (backend auth/tenant.py require_mini_app_user).
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { CardTransferOut, StorefrontOut } from "@/lib/types";

export type CartLine = {
  book_id: number;
  title: string;
  authors: string;
  cover: string | null;
  price: number;
  quantity: number;
};

export type SavedOrder = {
  id: number;
  number: number;
  token: string;
  created_at: string;
  total: number;
  card_transfer?: CardTransferOut | null;
  telegram_link?: string | null;
};

type TgWebApp = {
  initData: string;
  ready: () => void;
  expand: () => void;
  colorScheme?: string;
  BackButton?: { show: () => void; hide: () => void; onClick: (cb: () => void) => void; offClick: (cb: () => void) => void };
  HapticFeedback?: { impactOccurred: (s: string) => void; notificationOccurred: (s: string) => void };
};

declare global {
  interface Window {
    Telegram?: { WebApp?: TgWebApp };
  }
}

type ShopCtx = {
  store: StorefrontOut;
  slug: string;
  base: string;
  href: (path: string) => string;
  cart: CartLine[];
  cartCount: number;
  add: (line: Omit<CartLine, "quantity">, qty?: number) => void;
  setQty: (bookId: number, qty: number) => void;
  remove: (bookId: number) => void;
  clear: () => void;
  replaceCart: (lines: CartLine[]) => void;
  orders: SavedOrder[];
  saveOrder: (o: SavedOrder) => void;
  initData: string | null;
  inTelegram: boolean;
  haptic: (kind?: "light" | "success" | "error") => void;
};

const Ctx = createContext<ShopCtx | null>(null);
const MAX_QTY = 99;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode or full storage: the cart lives in memory only */
  }
}

function initDataFromHash(): string | null {
  const hash = typeof location !== "undefined" ? location.hash.slice(1) : "";
  if (!hash.includes("tgWebAppData=")) return null;
  return new URLSearchParams(hash).get("tgWebAppData");
}

export function ShopProvider({ store, base, children }: { store: StorefrontOut; base: string; children: React.ReactNode }) {
  const slug = store.slug;
  const cartKey = `javon_cart_${slug}`;
  const ordersKey = `javon_orders_${slug}`;
  const [cart, setCart] = useState<CartLine[]>([]);
  const [orders, setOrders] = useState<SavedOrder[]>([]);
  const [initData, setInitData] = useState<string | null>(null);

  useEffect(() => {
    setCart(read<CartLine[]>(cartKey, []));
    setOrders(read<SavedOrder[]>(ordersKey, []));
    const sync = (e: StorageEvent) => {
      if (e.key === cartKey) setCart(read<CartLine[]>(cartKey, []));
      if (e.key === ordersKey) setOrders(read<SavedOrder[]>(ordersKey, []));
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, [cartKey, ordersKey]);

  // Telegram Mini App: the init data arrives in the first URL's hash; keep it
  // for the session (later pages have no hash) and load Telegram's script.
  useEffect(() => {
    const key = `javon_tg_${slug}`;
    let data = initDataFromHash();
    try {
      if (data) sessionStorage.setItem(key, data);
      else data = sessionStorage.getItem(key);
    } catch {
      /* ignore */
    }
    if (!data) return;
    setInitData(data);
    const s = document.createElement("script");
    s.src = "https://telegram.org/js/telegram-web-app.js";
    s.async = true;
    s.onload = () => {
      const wa = window.Telegram?.WebApp;
      if (!wa) return;
      if (wa.initData) setInitData(wa.initData);
      wa.ready();
      wa.expand();
    };
    document.head.appendChild(s);
  }, [slug]);

  const persist = useCallback(
    (next: CartLine[]) => {
      setCart(next);
      write(cartKey, next);
    },
    [cartKey],
  );

  const haptic = useCallback((kind: "light" | "success" | "error" = "light") => {
    const h = window.Telegram?.WebApp?.HapticFeedback;
    if (!h) return;
    if (kind === "light") h.impactOccurred("light");
    else h.notificationOccurred(kind);
  }, []);

  const value = useMemo<ShopCtx>(() => {
    const href = (path: string) => {
      const p = path.startsWith("/") ? path : `/${path}`;
      if (!base) return p;
      return p === "/" ? base : `${base}${p}`;
    };
    return {
      store,
      slug,
      base,
      href,
      cart,
      cartCount: cart.reduce((n, l) => n + l.quantity, 0),
      add: (line, qty = 1) => {
        const cur = read<CartLine[]>(cartKey, cart);
        const found = cur.find((l) => l.book_id === line.book_id);
        const next = found
          ? cur.map((l) => (l.book_id === line.book_id ? { ...l, ...line, quantity: Math.min(MAX_QTY, l.quantity + qty) } : l))
          : [...cur, { ...line, quantity: Math.min(MAX_QTY, qty) }];
        persist(next);
        haptic("light");
      },
      setQty: (bookId, qty) =>
        persist(cart.map((l) => (l.book_id === bookId ? { ...l, quantity: Math.max(1, Math.min(MAX_QTY, qty)) } : l))),
      remove: (bookId) => persist(cart.filter((l) => l.book_id !== bookId)),
      clear: () => persist([]),
      replaceCart: persist,
      orders,
      saveOrder: (o) => {
        const next = [o, ...read<SavedOrder[]>(ordersKey, []).filter((x) => x.id !== o.id)].slice(0, 30);
        setOrders(next);
        write(ordersKey, next);
      },
      initData,
      inTelegram: !!initData,
      haptic,
    };
  }, [store, slug, base, cart, cartKey, ordersKey, orders, initData, persist, haptic]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useShop(): ShopCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useShop outside ShopProvider");
  return ctx;
}
