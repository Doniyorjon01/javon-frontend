import Link from "next/link";
import { BookCover } from "@/components/book-cover";
import { IArrow, ICheck, IPlus, IScan, IX } from "@/components/icons";
import { Pricing } from "@/components/landing/pricing";
import { Footer, Topbar } from "@/components/landing/topbar";
import { publicConfig } from "@/lib/config";
import { fmt } from "@/lib/i18n";
import { getDict } from "@/lib/i18n/server";
import { serverGet } from "@/lib/server-api";
import type { PlansOut } from "@/lib/types";

const SPINES: Array<[string, string, number, number, boolean?]> = [
  // background, text, width, height, leaning
  ["#2B3BD1", "#FFFFFF", 46, 230],
  ["#E9C46A", "#2A2312", 40, 200],
  ["#A8C5C2", "#16302D", 52, 250],
  ["#6E2E3A", "#F6E6E9", 44, 270],
  ["#F0B23E", "#15171C", 38, 210, true],
  ["#1F4D3F", "#F4EFE4", 50, 240],
  ["#14161B", "#F4EFE4", 42, 260],
  ["#B4472E", "#FFF3EC", 48, 225],
  ["#F7F6F2", "#15171C", 54, 280],
];

export default async function Landing() {
  const { lang, d } = await getDict();
  const cfg = publicConfig();
  let plans: PlansOut | null = null;
  try {
    plans = await serverGet<PlansOut>("/plans", lang, undefined, { revalidate: 300 });
  } catch {
    plans = null;
  }
  const trialDays = plans?.trial_days ?? 14;
  const L = d.landing;

  return (
    <>
      <section className="hero">
        <Topbar d={d} dark />
        <div className="hero-in">
          <div className="stack" style={{ gap: 22, paddingBottom: 48 }}>
            <span className="eyebrow">{L.eyebrow}</span>
            <h1>
              {L.heroTitle1} <em>{L.heroTitle2}</em>
            </h1>
            <p className="lead">{L.heroText}</p>
            <div className="row" style={{ gap: 12 }}>
              <Link href="/kirish?next=/admin/yangi" className="btn btn-saffron">
                {L.ctaCreate} <IArrow className="arr" size={18} />
              </Link>
              <Link href="#qanday" className="btn btn-ghost-d">
                {L.ctaHow}
              </Link>
            </div>
            <div className="ticks">
              <span><ICheck size={16} /> {fmt(L.trialBadge, { days: trialDays })}</span>
              <span><ICheck size={16} /> {L.noCard}</span>
              <span><ICheck size={16} /> {L.noCommission}</span>
            </div>
          </div>
          <div style={{ position: "relative" }}>
            <div className="float-toast">
              <span style={{ width: 36, height: 36, borderRadius: 10, background: "#2B3BD1", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <IPlus size={18} />
              </span>
              <span>
                <strong style={{ display: "block", fontSize: 14 }}>{L.toastTitle}</strong>
                <span className="muted xs">{L.toastText}</span>
              </span>
            </div>
            <div className="shelf" aria-hidden="true">
              {SPINES.map(([bg, fg, w, h, lean], i) => (
                <div key={i} className={`spine ${lean ? "lean" : ""}`} style={{ background: bg, color: fg, width: w, height: h }}>
                  <span>{L.shelf[i] ?? ""}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="qanday" className="section">
        <div className="container stack" style={{ gap: 40 }}>
          <div className="stack" style={{ gap: 12, maxWidth: 720 }}>
            <span className="eyebrow">{L.howEyebrow}</span>
            <h2 className="big">{L.howTitle}</h2>
            <p className="muted" style={{ fontSize: 18 }}>{L.howText}</p>
          </div>
          <div className="grid-3">
            <div className="card step lift">
              <div className="scanner" style={{ aspectRatio: "16/9", borderRadius: 14 }} aria-hidden="true">
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ background: "#fff", padding: "10px 12px 6px", borderRadius: 4, textAlign: "center" }}>
                    <IScan size={64} color="#15171C" />
                    <div className="mono" style={{ fontSize: 9, color: "#15171C" }}>978 9943 00 000 0</div>
                  </div>
                </div>
                <div className="scanline" />
              </div>
              <span className="num">01</span>
              <h3>{L.step1Title}</h3>
              <p className="muted">{L.step1Text}</p>
            </div>
            <div className="card step lift">
              <div className="row" style={{ gap: 14, background: "var(--paper)", borderRadius: 14, padding: 14 }}>
                <BookCover title="O'tkan kunlar" authors={["Abdulla Qodiriy"]} style={{ width: 52, fontSize: 7 }} />
                <div className="stack-sm" style={{ gap: 6, flex: 1 }}>
                  <div className="row-between small"><span className="muted">{d.books.price}</span><strong>65 000</strong></div>
                  <div className="row-between small"><span className="muted">{d.books.quantity}</span><strong>4</strong></div>
                </div>
              </div>
              <span className="num">02</span>
              <h3>{L.step2Title}</h3>
              <p className="muted">{L.step2Text}</p>
            </div>
            <div className="card step lift">
              <div className="stack-sm" style={{ background: "var(--paper)", borderRadius: 14, padding: 14 }}>
                <span className="badge b-info mono">varaq.{cfg.baseDomain === "localhost" ? "javon.uz" : cfg.baseDomain}</span>
                <span className="badge b-ok">@varaq_bot · Mini App</span>
                <span className="badge">QR · PDF</span>
              </div>
              <span className="num">03</span>
              <h3>{L.step3Title}</h3>
              <p className="muted">{L.step3Text}</p>
            </div>
          </div>
        </div>
      </section>

      <section id="imkoniyatlar" className="section" style={{ background: "#EFEDE6" }}>
        <div className="container stack" style={{ gap: 36 }}>
          <div className="stack" style={{ gap: 12, maxWidth: 760 }}>
            <span className="eyebrow">{L.featEyebrow}</span>
            <h2 className="big">{L.featTitle}</h2>
          </div>
          <div className="bento">
            <div className="card wide lift">
              <h3>{L.f1Title}</h3>
              <p className="muted">{L.f1Text}</p>
              <div className="stack-sm" style={{ marginTop: 8 }}>
                {[
                  ["O'tkan kunlar", "Abdulla Qodiriy"],
                  ["Mehrobdan chayon", "Abdulla Qodiriy"],
                  ["Obid ketmon", "Abdulla Qodiriy"],
                ].map(([t, a]) => (
                  <div key={t} className="srow">
                    <BookCover title={t} authors={[a]} className="bthumb" />
                    <span><strong>{t}</strong><br /><span className="muted small">{a}</span></span>
                    <span className="add btn btn-primary btn-xs"><IPlus size={14} /> {d.common.add}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="card lift">
              <h3>{L.f2Title}</h3>
              <p className="muted">{L.f2Text}</p>
              <div className="stack-sm" style={{ marginTop: "auto" }}>
                <span className="badge" style={{ fontSize: 15, alignSelf: "flex-start" }}>O&apos;tkan kunlar</span>
                <span className="badge b-info" style={{ fontSize: 15, alignSelf: "flex-end" }}>Ўткан кунлар</span>
              </div>
            </div>
            <div className="card lift">
              <h3>{L.f3Title}</h3>
              <p className="muted">{L.f3Text}</p>
              <div className="card card-tight" style={{ background: "var(--paper)", borderRadius: 14, marginTop: "auto" }}>
                <div className="row-between"><strong className="mono">#128</strong><span className="badge b-new">{L.orderCardNew}</span></div>
                <p className="small muted" style={{ margin: "6px 0 10px" }}>O&apos;tkan kunlar × 1 · Sarob × 1</p>
                <div className="row" style={{ gap: 8 }}>
                  <span className="btn btn-primary btn-xs">{d.orders.accept}</span>
                  <span className="btn btn-soft btn-xs">{d.orders.cancel}</span>
                </div>
              </div>
            </div>
            <div className="card wide lift">
              <h3>{L.f4Title}</h3>
              <p className="muted">{L.f4Text}</p>
              <div style={{ background: "var(--paper)", borderRadius: 14, padding: 16, marginTop: 8 }}>
                <span className="mono xs muted">varaq.javon.uz › kitob › 12</span>
                <p style={{ color: "#1a0dab", fontSize: 18, margin: "4px 0" }}>O&apos;tkan kunlar — Abdulla Qodiriy | Varaq</p>
                <p className="small muted">65 000 so&apos;m · {d.shop.inStock}</p>
              </div>
            </div>
            <div className="card lift"><h3>{L.f5Title}</h3><p className="muted">{L.f5Text}</p></div>
            <div className="card lift"><h3>{L.f6Title}</h3><p className="muted">{L.f6Text}</p></div>
            <div className="card lift"><h3>{L.f7Title}</h3><p className="muted">{L.f7Text}</p></div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container stack" style={{ gap: 36 }}>
          <div className="stack" style={{ gap: 12, maxWidth: 760 }}>
            <span className="eyebrow">{L.compareEyebrow}</span>
            <h2 className="big">{L.compareTitle}</h2>
          </div>
          <div className="grid-2">
            <div className="card stack" style={{ background: "#E7E3D8" }}>
              <div className="row-between"><strong>{L.nowLabel}</strong><span className="mono small muted">23:47 → 09:12</span></div>
              <div className="stack-sm" style={{ gap: 8 }}>
                <span className="bubble in">{L.chat1}</span>
                <span className="bubble in">{L.chat2}</span>
                <span className="bubble out">{L.chat3}</span>
                <span className="bubble out">{L.chat4}</span>
                <span className="muted small" style={{ textAlign: "center" }}>{L.chat5}</span>
              </div>
              <div className="stack-sm">
                {[L.pain1, L.pain2, L.pain3].map((x) => (
                  <span key={x} className="feat"><IX size={18} color="#E5484D" /> {x}</span>
                ))}
              </div>
            </div>
            <div className="card stack">
              <div className="row-between"><strong>{L.withLabel}</strong><span className="mono small muted">23:47 → 23:48</span></div>
              <div className="card card-tight" style={{ background: "var(--paper)" }}>
                <div className="row-between"><strong className="mono">#128</strong><span className="badge b-new">{L.orderCardNew}</span></div>
                <p className="small" style={{ margin: "8px 0 4px" }}>Sarob, O&apos;tkan kunlar</p>
                <p className="small muted">{L.orderCardPay} · 128 000 so&apos;m</p>
              </div>
              <div className="stack-sm">
                {[L.gain1, L.gain2, L.gain3].map((x) => (
                  <span key={x} className="feat"><ICheck size={18} color="#2A9D8F" /> {x}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="narxlar" className="section" style={{ background: "#EFEDE6" }}>
        <div className="container stack" style={{ gap: 28 }}>
          <div className="stack" style={{ gap: 12 }}>
            <span className="eyebrow">{L.pricingEyebrow}</span>
            <h2 className="big">{L.pricingTitle}</h2>
            <p className="muted" style={{ fontSize: 18 }}>{fmt(L.pricingText, { days: trialDays })}</p>
          </div>
          {plans && <Pricing plans={plans} />}
        </div>
      </section>

      <section id="savollar" className="section">
        <div className="container faq" style={{ maxWidth: 900 }}>
          <h2 className="big" style={{ marginBottom: 16 }}>{L.faqTitle}</h2>
          {[
            [L.q1, L.a1],
            [L.q2, L.a2],
            [L.q3, L.a3],
            [L.q4, L.a4],
          ].map(([q, a]) => (
            <details key={q}>
              <summary>
                {q}
                <span className="pm"><IPlus size={18} /></span>
              </summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="section" style={{ background: "var(--ink)", color: "var(--paper)" }}>
        <div className="container stack" style={{ alignItems: "flex-start", gap: 24 }}>
          <h2 className="big" style={{ maxWidth: 760 }}>{L.finalTitle}</h2>
          <div className="row" style={{ gap: 12 }}>
            <Link href="/kirish?next=/admin/yangi" className="btn btn-saffron">
              {L.ctaCreate} <IArrow className="arr" size={18} />
            </Link>
            {cfg.supportTelegram && (
              <a href={`https://t.me/${cfg.supportTelegram}`} target="_blank" rel="noreferrer" className="btn btn-ghost-d">
                {L.askTelegram}
              </a>
            )}
          </div>
        </div>
      </section>
      <Footer d={d} support={cfg.supportTelegram} />
    </>
  );
}
