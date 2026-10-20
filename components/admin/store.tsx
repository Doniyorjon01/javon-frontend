"use client";

/**
 * The store being managed: its settings (TenantOut), the user's role in it and
 * the order badges. Everything under /admin/[tenantId] reads it from here.
 */
import { useParams } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ApiError, api } from "@/lib/api";
import { storeUrl } from "@/lib/format";
import { useInterval } from "@/lib/hooks";
import type { MyStoreOut, OrderStatsOut, TenantOut } from "@/lib/types";
import { useApp } from "../app";
import { ErrorBox, Loading } from "../ui";
import { useSession } from "./session";

type StoreCtx = {
  id: number;
  base: string;
  tenant: TenantOut;
  setTenant: (t: TenantOut) => void;
  reloadTenant: () => Promise<void>;
  my: MyStoreOut;
  isOwner: boolean;
  readOnly: boolean;
  siteUrl: string;
  orderStats: OrderStatsOut | null;
  reloadStats: () => void;
};

const Ctx = createContext<StoreCtx | null>(null);

export function StoreProvider({ children, notFound }: { children: React.ReactNode; notFound: React.ReactNode }) {
  const { config } = useApp();
  const { me, reload: reloadMe } = useSession();
  const params = useParams<{ tenantId: string }>();
  const id = Number(params.tenantId);
  const my = me.stores.find((s) => s.tenant_id === id);
  const [tenant, setTenant] = useState<TenantOut | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [orderStats, setOrderStats] = useState<OrderStatsOut | null>(null);

  const reloadTenant = useCallback(async () => {
    try {
      setTenant(await api<TenantOut>(`/tenants/${id}`));
      setError(null);
    } catch (e) {
      setError(e as ApiError);
    }
  }, [id]);

  const reloadStats = useCallback(() => {
    api<OrderStatsOut>(`/tenants/${id}/orders/stats`)
      .then(setOrderStats)
      .catch(() => undefined);
  }, [id]);

  useEffect(() => {
    if (!my) return;
    void reloadTenant();
    reloadStats();
  }, [my, reloadTenant, reloadStats]);

  useInterval(reloadStats, my ? 30_000 : null);

  const value = useMemo<StoreCtx | null>(() => {
    if (!my || !tenant) return null;
    return {
      id,
      base: `/admin/${id}`,
      tenant,
      setTenant: (t: TenantOut) => {
        setTenant(t);
        // name / launch state also live in /auth/me (sidebar, store list)
        if (t.name !== my.name || !!t.launched_at !== !!my.launched_at || !!t.paused_at !== !!my.paused_at) void reloadMe();
      },
      reloadTenant,
      my,
      isOwner: my.role === "owner",
      readOnly: my.access === "expired" || my.access === "suspended",
      siteUrl: storeUrl(config.storeUrlTemplate, tenant.slug),
      orderStats,
      reloadStats,
    };
  }, [id, my, tenant, reloadTenant, orderStats, reloadStats, config.storeUrlTemplate, reloadMe]);

  if (!my || !Number.isFinite(id)) return <>{notFound}</>;
  if (error) {
    return (
      <div className="container" style={{ paddingTop: 60 }}>
        <ErrorBox error={error} onRetry={reloadTenant} />
      </div>
    );
  }
  if (!value) return <Loading />;
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): StoreCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore outside StoreProvider");
  return ctx;
}
