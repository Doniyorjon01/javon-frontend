"use client";

import Link from "next/link";
import { useState } from "react";
import { fmt } from "@/lib/i18n";
import { money } from "@/lib/format";
import type { PlansOut } from "@/lib/types";
import { useApp } from "../app";
import { ICheck } from "../icons";

export function Pricing({ plans }: { plans: PlansOut }) {
  const { d, lang } = useApp();
  const [yearly, setYearly] = useState(false);
  const forWhom: Record<string, string> = {
    start: d.landing.planStartFor,
    standard: d.landing.planStandardFor,
    pro: d.landing.planProFor,
  };
  return (
    <div className="stack" style={{ gap: 28 }}>
      <div className="seg" role="group" style={{ alignSelf: "flex-start" }}>
        <button className={!yearly ? "on" : ""} aria-pressed={!yearly} onClick={() => setYearly(false)}>
          {d.landing.monthly}
        </button>
        <button className={yearly ? "on" : ""} aria-pressed={yearly} onClick={() => setYearly(true)}>
          {d.landing.yearly}
        </button>
      </div>
      <div className="grid-3" style={{ alignItems: "stretch" }}>
        {plans.plans.map((p) => {
          const hl = p.plan === "standard";
          return (
            <div key={p.plan} className={`card price ${hl ? "hl" : ""}`}>
              {hl && <span className="eyebrow" style={{ color: "var(--saffron)" }}>{d.landing.popular}</span>}
              <div>
                <h3 style={{ fontSize: 24 }}>{d.enums.plan[p.plan]}</h3>
                <p style={{ opacity: 0.7, fontSize: 15 }}>{forWhom[p.plan]}</p>
              </div>
              <div className="row" style={{ alignItems: "baseline", gap: 8 }}>
                <span className="amount">{money(yearly ? p.yearly_price : p.monthly_price, lang)}</span>
                <span style={{ opacity: 0.7 }}>{yearly ? d.landing.perYear : d.common.perMonth}</span>
              </div>
              <div className="stack-sm" style={{ gap: 10 }}>
                <span className="feat"><ICheck className="feat-check" size={18} />{p.item_limit ? fmt(d.landing.upToBooks, { n: p.item_limit.toLocaleString("ru-RU") }) : d.landing.unlimitedBooks}</span>
                <span className="feat"><ICheck className="feat-check" size={18} />{fmt(d.landing.staffLimit, { n: p.staff_limit })}</span>
                <span className="feat"><ICheck className="feat-check" size={18} />{d.landing.featSite}</span>
                <span className="feat"><ICheck className="feat-check" size={18} />{d.landing.featQr}</span>
                {p.excel_import && <span className="feat"><ICheck className="feat-check" size={18} />{d.landing.featExcel}</span>}
              </div>
              <Link href="/kirish?next=/admin/yangi" className={`btn ${hl ? "btn-saffron" : "btn-ghost"}`} style={{ marginTop: "auto" }}>
                {d.landing.startFree}
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
