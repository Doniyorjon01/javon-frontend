import type { Metadata } from "next";
import { AppProvider } from "@/components/app";
import { ShopFooter, ShopHeader, StickyCart } from "@/components/shop/parts";
import { ShopProvider } from "@/components/shop/shop";
import { publicConfig } from "@/lib/config";
import { shopContext } from "@/lib/shop-server";
import { accentFg, asTheme } from "@/lib/theme";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { store, d } = await shopContext(slug);
  if (!store) return { title: d.shop.storeClosed, robots: { index: false } };
  return {
    title: { default: store.name, template: `%s · ${store.name}` },
    description: [store.name, store.address, store.delivery_area].filter(Boolean).join(" · "),
    icons: store.logo?.s ? { icon: store.logo.s } : undefined,
    openGraph: { title: store.name, images: store.logo?.l ? [store.logo.l] : undefined },
  };
}

export default async function ShopLayout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { store, lang, d, base } = await shopContext(slug);
  const cfg = publicConfig();

  if (!store) {
    return (
      <AppProvider lang={lang} dict={d} config={cfg}>
        <main className="auth-page">
          <div className="auth-box" style={{ marginTop: "18vh", textAlign: "center", alignItems: "center" }}>
            <span className="mono muted">{slug}</span>
            <h1>{d.shop.storeClosed}</h1>
            <p className="muted">{d.shop.storeClosedText}</p>
          </div>
        </main>
      </AppProvider>
    );
  }

  const theme = asTheme(store.theme);
  const style = {
    "--s-accent": store.accent_color,
    "--s-accent-fg": accentFg(store.accent_color),
  } as React.CSSProperties;

  return (
    <AppProvider lang={lang} dict={d} config={cfg}>
      <ShopProvider store={store} base={base}>
        <div className={`sf sf-theme-${theme}`} style={style} lang={lang}>
          <ShopHeader />
          <main className="sf-main">{children}</main>
          <ShopFooter appUrl={cfg.appUrl} />
          <StickyCart />
        </div>
      </ShopProvider>
    </AppProvider>
  );
}
