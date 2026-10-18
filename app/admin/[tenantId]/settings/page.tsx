"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useApp } from "@/components/app";
import {
  ContactsSection,
  DeliverySection,
  LookSection,
  PaymentSection,
  StoreSection,
} from "@/components/admin/settings-sections";
import { OwnerOnly, PageHead } from "@/components/admin/shell";
import { useStore } from "@/components/admin/store";

type Tab = "store" | "look" | "contacts" | "delivery" | "payment";

function SettingsInner() {
  const { d } = useApp();
  const { base } = useStore();
  const router = useRouter();
  const params = useSearchParams();
  const [tab, setTab] = useState<Tab>((params.get("tab") as Tab) || "store");
  const go = (t: Tab) => {
    setTab(t);
    router.replace(`${base}/settings?tab=${t}`, { scroll: false });
  };
  return (
    <OwnerOnly note={d.settings.ownerOnly}>
      <PageHead title={d.settings.title} />
      <div className="tabs" style={{ marginBottom: 16 }}>
        {(Object.keys(d.settings.tabs) as Tab[]).map((t) => (
          <button key={t} className={`tab ${tab === t ? "on" : ""}`} onClick={() => go(t)}>
            {d.settings.tabs[t]}
          </button>
        ))}
      </div>
      <div style={{ maxWidth: tab === "look" ? 1100 : 820 }}>
        {tab === "store" && <StoreSection />}
        {tab === "look" && <LookSection />}
        {tab === "contacts" && <ContactsSection />}
        {tab === "delivery" && <DeliverySection />}
        {tab === "payment" && <PaymentSection />}
      </div>
    </OwnerOnly>
  );
}

export default function SettingsPage() {
  return (
    <Suspense>
      <SettingsInner />
    </Suspense>
  );
}
