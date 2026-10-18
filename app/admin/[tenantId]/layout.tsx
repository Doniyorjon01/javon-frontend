"use client";

import Link from "next/link";
import { useT } from "@/components/app";
import { AdminShell } from "@/components/admin/shell";
import { StoreProvider } from "@/components/admin/store";

function NotFound() {
  const d = useT();
  return (
    <div className="auth-box" style={{ marginTop: "18vh", textAlign: "center", alignItems: "center" }}>
      <span className="mono muted">404</span>
      <h1>{d.common.notFoundTitle}</h1>
      <Link href="/admin?list=1" className="btn btn-ink">
        {d.stores.title}
      </Link>
    </div>
  );
}

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider notFound={<NotFound />}>
      <AdminShell>{children}</AdminShell>
    </StoreProvider>
  );
}
