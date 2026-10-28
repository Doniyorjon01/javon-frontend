"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/components/app";
import { BookCover } from "@/components/book-cover";
import { ICart, IMinus, IPin, IPlus, ITrash } from "@/components/icons";
import { useShop } from "@/components/shop/shop";
import { ErrorBox, Field, Spinner } from "@/components/ui";
import { ApiError, api } from "@/lib/api";
import { money } from "@/lib/format";
import { fmt } from "@/lib/i18n";
import type { DeliveryType, OrderCreatedOut, PaymentMethod } from "@/lib/types";

const DETAILS_KEY = "javon_buyer";

function newKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
    (Number(c) ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (Number(c) / 4)))).toString(16),
  );
}

export default function CartPage() {
  const { d, lang } = useApp();
  const { store, slug, cart, setQty, remove, replaceCart, clear, href, saveOrder, initData, haptic } = useShop();
  const router = useRouter();

  const fulfilment: DeliveryType[] = [
    ...(store.pickup_enabled ? (["pickup"] as const) : []),
    ...(store.delivery_enabled ? (["delivery"] as const) : []),
  ];
  const methods: PaymentMethod[] = [
    ...(store.cash_enabled ? (["cash"] as const) : []),
    ...(store.card_transfer_enabled ? (["card_transfer"] as const) : []),
  ];

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [type, setType] = useState<DeliveryType>(fulfilment[0] ?? "pickup");
  const [address, setAddress] = useState("");
  const [loc, setLoc] = useState<{ lat: number; lon: number } | null>(null);
  const [locBusy, setLocBusy] = useState(false);
  const [comment, setComment] = useState("");
  const [method, setMethod] = useState<PaymentMethod>(methods[0] ?? "cash");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // The buyer's name and phone are remembered on this device only.
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(DETAILS_KEY) ?? "{}");
      if (saved.name) setName(saved.name);
      if (saved.phone) setPhone(saved.phone);
      if (saved.address) setAddress(saved.address);
    } catch {
      /* ignore */
    }
  }, []);

  const subtotal = cart.reduce((s, l) => s + l.price * l.quantity, 0);
  const fee =
    type === "delivery" ? (store.free_delivery_from && subtotal >= store.free_delivery_from ? 0 : store.delivery_fee) : 0;
  const total = subtotal + fee;

  // One key per cart + details: a retried click (or a lost answer) never creates
  // a second order; the backend returns the first one (idempotency_key).
  const fingerprint = useMemo(
    () => JSON.stringify({ cart: cart.map((l) => [l.book_id, l.quantity]), name, phone, type, address, loc, comment, method }),
    [cart, name, phone, type, address, loc, comment, method],
  );
  const [idem, setIdem] = useState<{ fp: string; key: string } | null>(null);

  function locate() {
    if (!navigator.geolocation) return;
    setLocBusy(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setLoc({ lat: Number(p.coords.latitude.toFixed(6)), lon: Number(p.coords.longitude.toFixed(6)) });
        setLocBusy(false);
      },
      () => setLocBusy(false),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!cart.length) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    const key = idem && idem.fp === fingerprint ? idem.key : newKey();
    setIdem({ fp: fingerprint, key });
    try {
      const order = await api<OrderCreatedOut>(`/storefront/${slug}/orders`, {
        json: {
          idempotency_key: key,
          customer_name: name.trim(),
          phone: phone.trim(),
          delivery_type: type,
          address: type === "delivery" ? address.trim() : null,
          latitude: type === "delivery" && loc ? loc.lat : null,
          longitude: type === "delivery" && loc ? loc.lon : null,
          comment: comment.trim() || null,
          payment_method: method,
          items: cart.map((l) => ({ book_id: l.book_id, quantity: l.quantity })),
        },
        headers: initData ? { "X-Telegram-Init-Data": initData } : undefined,
      });
      try {
        localStorage.setItem(DETAILS_KEY, JSON.stringify({ name: name.trim(), phone: phone.trim(), address: address.trim() }));
      } catch {
        /* ignore */
      }
      saveOrder({
        id: order.id,
        number: order.number,
        token: order.tracking_token,
        created_at: order.created_at,
        total: order.total,
        card_transfer: order.card_transfer ?? null,
        telegram_link: order.telegram_link ?? null,
      });
      clear();
      haptic("success");
      router.replace(`${href(`/buyurtma/${order.id}`)}?token=${encodeURIComponent(order.tracking_token)}&new=1`);
    } catch (err) {
      haptic("error");
      const ae = err as ApiError;
      if (ae.code === "order_items_unavailable" && Array.isArray(ae.detail.book_ids)) {
        const gone = new Set(ae.detail.book_ids as number[]);
        replaceCart(cart.filter((l) => !gone.has(l.book_id)));
        setNotice(d.shop.removed);
      } else if (ae.code === "out_of_stock" && Array.isArray(ae.detail.items)) {
        const avail = new Map((ae.detail.items as Array<{ book_id: number; available: number }>).map((x) => [x.book_id, x.available]));
        replaceCart(
          cart
            .map((l) => (avail.has(l.book_id) ? { ...l, quantity: Math.min(l.quantity, avail.get(l.book_id)!) } : l))
            .filter((l) => l.quantity > 0),
        );
        setNotice(d.shop.shortStock);
      } else {
        setError(ae);
      }
      if (ae.code === "idempotency_conflict") setIdem(null);
    } finally {
      setBusy(false);
    }
  }

  if (!cart.length) {
    return (
      <div className="container">
        <div className="empty" style={{ paddingTop: 80 }}>
          <div className="ico" style={{ background: "var(--s-soft)", color: "var(--s-fg)" }}>
            <ICart />
          </div>
          <strong style={{ color: "var(--s-fg)" }}>{d.shop.cartEmpty}</strong>
          <p>{d.shop.cartEmptyText}</p>
          {notice && <div className="note">{notice}</div>}
          <Link href={href("/")} className="hbtn hbtn-f">
            {d.shop.toCatalog}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: 1080 }}>
      <h1 className="sf-h" style={{ fontSize: 34, fontWeight: 600, letterSpacing: "-0.02em", marginBottom: 20 }}>{d.shop.cart}</h1>
      <form onSubmit={submit} className="grid-2" style={{ alignItems: "start", gap: 28 }}>
        <div className="stack">
          <div className="card" style={{ padding: "4px 20px" }}>
            {cart.map((l) => (
              <div key={l.book_id} className="cart-line">
                <Link href={href(`/kitob/${l.book_id}`)}>
                  <BookCover title={l.title} authors={[l.authors]} cover={l.cover ? { s: l.cover } : null} size="s" style={{ fontSize: 6 }} />
                </Link>
                <div style={{ minWidth: 0 }} className="stack-sm">
                  <Link href={href(`/kitob/${l.book_id}`)} style={{ color: "var(--s-fg)", fontWeight: 600, textDecoration: "none" }}>
                    {l.title}
                  </Link>
                  <span className="muted small">{l.authors}</span>
                  <div className="row" style={{ gap: 8 }}>
                    <div className="stp" style={{ padding: 2 }}>
                      <button type="button" onClick={() => setQty(l.book_id, l.quantity - 1)} disabled={l.quantity <= 1} aria-label="-1" style={{ width: 32, height: 32 }}>
                        <IMinus size={14} />
                      </button>
                      <span>{l.quantity}</span>
                      <button type="button" onClick={() => setQty(l.book_id, l.quantity + 1)} disabled={l.quantity >= 99} aria-label="+1" style={{ width: 32, height: 32 }}>
                        <IPlus size={14} />
                      </button>
                    </div>
                    <button type="button" className="btn-link small" style={{ color: "var(--s-muted)" }} onClick={() => remove(l.book_id)} aria-label={d.shop.remove}>
                      <ITrash size={15} />
                    </button>
                  </div>
                </div>
                <strong className="nowrap cart-line-sum">{money(l.price * l.quantity, lang)}</strong>
              </div>
            ))}
          </div>
          {notice && <div className="note">{notice}</div>}
        </div>

        <div className="stack">
          <div className="card stack">
            <h2>{d.shop.yourDetails}</h2>
            <Field label={d.shop.name}>
              <input className="inp" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={80} autoComplete="name" />
            </Field>
            <Field label={d.shop.phone}>
              <input className="inp" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder={d.shop.phonePh} autoComplete="tel" />
            </Field>
          </div>

          <div className="card stack">
            <h2>{d.shop.howToGet}</h2>
            {fulfilment.map((t) => (
              <label key={t} className={`opt ${type === t ? "on" : ""}`}>
                <input type="radio" name="type" checked={type === t} onChange={() => setType(t)} />
                <span className="stack-sm" style={{ gap: 2 }}>
                  <strong>{t === "pickup" ? d.shop.pickup : d.shop.delivery}</strong>
                  <span className="muted small">
                    {t === "pickup"
                      ? store.address ?? ""
                      : [
                          store.delivery_fee ? fmt(d.shop.deliveryFee, { fee: money(store.delivery_fee, lang) }) : d.shop.free,
                          store.free_delivery_from ? fmt(d.shop.freeFrom, { sum: money(store.free_delivery_from, lang) }) : null,
                          store.delivery_area,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                  </span>
                </span>
              </label>
            ))}
            {type === "delivery" && (
              <>
                <Field label={d.shop.address}>
                  <input className="inp" value={address} onChange={(e) => setAddress(e.target.value)} required minLength={5} maxLength={255} placeholder={d.shop.addressPh} autoComplete="street-address" />
                </Field>
                <button type="button" className="hbtn hbtn-o" style={{ alignSelf: "flex-start", minHeight: 40 }} onClick={locate} disabled={locBusy}>
                  {locBusy ? <Spinner /> : <IPin size={16} />} {loc ? d.shop.locationAttached : d.shop.attachLocation}
                </button>
              </>
            )}
            <Field label={d.shop.comment} optional>
              <textarea className="inp" value={comment} onChange={(e) => setComment(e.target.value)} maxLength={500} placeholder={d.shop.commentPh} style={{ minHeight: 70 }} />
            </Field>
          </div>

          <div className="card stack">
            <h2>{d.shop.payment}</h2>
            {methods.map((m) => (
              <label key={m} className={`opt ${method === m ? "on" : ""}`}>
                <input type="radio" name="method" checked={method === m} onChange={() => setMethod(m)} />
                <span className="stack-sm" style={{ gap: 2 }}>
                  <strong>{d.enums.paymentMethod[m]}</strong>
                  <span className="muted small">
                    {m === "card_transfer" ? d.shop.payCard : type === "pickup" ? d.shop.payCashPickup : d.shop.payCashDelivery}
                  </span>
                </span>
              </label>
            ))}
          </div>

          <div className="card stack-sm">
            <div className="row-between">
              <span className="muted">{d.shop.subtotal}</span>
              <span>{money(subtotal, lang)}</span>
            </div>
            {type === "delivery" && (
              <div className="row-between">
                <span className="muted">{d.shop.deliveryLine}</span>
                <span>{fee ? money(fee, lang) : d.shop.free}</span>
              </div>
            )}
            <div className="row-between" style={{ fontSize: 20, fontWeight: 700, paddingTop: 6 }}>
              <span>{d.shop.total}</span>
              <span>{money(total, lang)}</span>
            </div>
            <ErrorBox error={error} />
            <button className="cta-wide" style={{ marginTop: 8 }} disabled={busy || !fulfilment.length || !methods.length}>
              <span className="row" style={{ gap: 8 }}>
                {busy && <Spinner />} {busy ? d.shop.placing : d.shop.placeOrder}
              </span>
              <span>{money(total, lang)}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
