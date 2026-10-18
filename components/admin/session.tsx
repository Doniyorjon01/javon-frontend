"use client";

/** The signed-in user for /admin and /system. Not signed in -> /kirish?next=<here>. */
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { ApiError, api } from "@/lib/api";
import type { MeOut } from "@/lib/types";
import { ErrorBox, Loading } from "../ui";

type SessionCtx = { me: MeOut; reload: () => Promise<void>; logout: () => Promise<void> };
const Ctx = createContext<SessionCtx | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [me, setMe] = useState<MeOut | null>(null);
  const [error, setError] = useState<ApiError | null>(null);

  const load = useCallback(async () => {
    try {
      setMe(await api<MeOut>("/auth/me"));
      setError(null);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        router.replace(`/kirish?next=${encodeURIComponent(pathname)}`);
        return;
      }
      setError(e as ApiError);
    }
  }, [router, pathname]);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = useCallback(async () => {
    try {
      await api("/auth/logout", { method: "POST" });
    } finally {
      router.replace("/");
      router.refresh();
    }
  }, [router]);

  if (error) {
    return (
      <div className="container" style={{ paddingTop: 60 }}>
        <ErrorBox error={error} onRetry={load} />
      </div>
    );
  }
  if (!me) return <Loading />;
  return <Ctx.Provider value={{ me, reload: load, logout }}>{children}</Ctx.Provider>;
}

export function useSession(): SessionCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSession outside SessionProvider");
  return ctx;
}
