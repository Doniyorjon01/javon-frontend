import { Suspense } from "react";
import { Topbar } from "@/components/landing/topbar";
import { getDict } from "@/lib/i18n/server";
import { LoginForm } from "./login-form";

export async function generateMetadata() {
  const { d } = await getDict();
  return { title: d.login.title };
}

export default async function LoginPage() {
  const { d } = await getDict();
  return (
    <main className="auth-page">
      <Topbar d={d} links={false} />
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
