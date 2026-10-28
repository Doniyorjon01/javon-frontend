import type { Metadata, Viewport } from "next";
import { AppProvider } from "@/components/app";
import { publicConfig } from "@/lib/config";
import { getDict } from "@/lib/i18n/server";
import "./globals.css";
import "./responsive.css";

export async function generateMetadata(): Promise<Metadata> {
  const { d } = await getDict();
  return {
    title: { default: d.meta.title, template: "%s · javon.uz" },
    description: d.meta.description,
    icons: { icon: "/icon.svg" },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // iPhone notch / home bar: lets env(safe-area-inset-*) keep fixed bars clear of them.
  viewportFit: "cover",
  themeColor: "#15171C",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { lang, d } = await getDict();
  return (
    <html lang={lang}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Literata (headings), Onest (interface), JetBrains Mono (ISBN, numbers): Latin + Cyrillic. */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Literata:ital,opsz,wght@0,7..72,400..700;1,7..72,400..700&family=Onest:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap&subset=cyrillic,latin"
        />
      </head>
      <body>
        <AppProvider lang={lang} dict={d} config={publicConfig()}>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
