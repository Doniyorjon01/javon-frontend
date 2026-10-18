import Link from "next/link";
import { getDict } from "@/lib/i18n/server";

export default async function NotFound() {
  const { d } = await getDict();
  return (
    <main className="auth-page">
      <div className="auth-box" style={{ marginTop: "18vh", textAlign: "center", alignItems: "center" }}>
        <span className="mono muted">404</span>
        <h1>{d.common.notFoundTitle}</h1>
        <p className="muted">{d.common.notFoundText}</p>
        <Link href="/" className="btn btn-ink">
          {d.common.toHome}
        </Link>
      </div>
    </main>
  );
}
