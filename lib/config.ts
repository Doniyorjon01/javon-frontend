/**
 * Runtime settings, read from the environment on the server (never baked into
 * the browser bundle), so one Docker image works locally and in production.
 *
 *   API_URL               where the Next.js server reaches the FastAPI backend
 *   APP_URL               this site's own address (javon.uz)
 *   BASE_DOMAIN           store sites live on <slug>.BASE_DOMAIN
 *   STORE_URL_TEMPLATE    a store's public address, {slug} is replaced
 *   TELEGRAM_BOT_USERNAME the platform bot (Telegram Login Widget), no @
 *   DEV_LOGIN             "true" shows the local sign-in form (backend ENV=local + DEBUG=true)
 *   SUPPORT_TELEGRAM      the support account, no @
 */
import "server-only";

function clean(v: string | undefined): string | null {
  const s = (v ?? "").trim();
  return s ? s : null;
}

export const serverConfig = {
  apiUrl: (clean(process.env.API_URL) ?? "http://127.0.0.1:8010").replace(/\/+$/, ""),
  appUrl: (clean(process.env.APP_URL) ?? "http://localhost:3000").replace(/\/+$/, ""),
  baseDomain: (clean(process.env.BASE_DOMAIN) ?? "localhost").toLowerCase(),
};

/** What the browser needs to know; passed down from the root layout. */
export type PublicConfig = {
  appUrl: string;
  baseDomain: string;
  storeUrlTemplate: string;
  telegramBot: string | null;
  devLogin: boolean;
  supportTelegram: string | null;
};

export function publicConfig(): PublicConfig {
  return {
    appUrl: serverConfig.appUrl,
    baseDomain: serverConfig.baseDomain,
    storeUrlTemplate: clean(process.env.STORE_URL_TEMPLATE) ?? `${serverConfig.appUrl}/s/{slug}`,
    telegramBot: clean(process.env.TELEGRAM_BOT_USERNAME)?.replace(/^@/, "") ?? null,
    devLogin: process.env.DEV_LOGIN === "true",
    supportTelegram: clean(process.env.SUPPORT_TELEGRAM)?.replace(/^@/, "") ?? null,
  };
}
