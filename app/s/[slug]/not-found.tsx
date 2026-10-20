import { serverConfig } from "@/lib/config";
import { getDict } from "@/lib/i18n/server";

/** A store that does not exist or is closed (app/s/[slug]/layout.tsx): status 404. */
export default async function StoreNotFound() {
    const { d } = await getDict();
    return (
        <main className="auth-page">
            <div className="auth-box" style={{ marginTop: "18vh", textAlign: "center", alignItems: "center" }}>
                <span className="mono muted">404</span>
                <h1>{d.shop.storeClosed}</h1>
                <p className="muted">{d.shop.storeClosedText}</p>
                {/* Absolute: on a store's own domain "/" is that (missing) store again. */}
                <a href={serverConfig.appUrl} className="btn btn-ink">
                    {d.common.toHome}
                </a>
            </div>
        </main>
    );
}
