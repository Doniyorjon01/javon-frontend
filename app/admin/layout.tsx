import { SessionProvider } from "@/components/admin/session";

export const metadata = { robots: { index: false } };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
