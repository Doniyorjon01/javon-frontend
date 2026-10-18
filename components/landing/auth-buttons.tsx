"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { MeOut } from "@/lib/types";
import { useT } from "../app";
import { IArrow } from "../icons";

/** "Kirish" + "Do'kon yaratish", or "Do'konlarim" once signed in. */
export function AuthButtons({ dark = false }: { dark?: boolean }) {
  const d = useT();
  const [me, setMe] = useState<MeOut | null | undefined>(undefined);
  useEffect(() => {
    api<MeOut>("/auth/me")
      .then(setMe)
      .catch(() => setMe(null));
  }, []);
  if (me) {
    return (
      <Link href="/admin" className={`btn btn-sm ${dark ? "btn-saffron" : "btn-primary"}`}>
        {d.nav.myStores} <IArrow className="arr" size={16} />
      </Link>
    );
  }
  return (
    <div className="row" style={{ gap: 14 }}>
      <Link href="/kirish" className={`nl ${dark ? "" : "nl-ink"}`} style={{ fontWeight: 600 }}>
        {d.nav.login}
      </Link>
      <Link href="/kirish?next=/admin/yangi" className={`btn btn-sm ${dark ? "btn-saffron" : "btn-primary"}`}>
        {d.nav.create}
      </Link>
    </div>
  );
}
