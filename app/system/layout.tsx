import { SessionProvider } from "@/components/admin/session";
import { SystemShell } from "@/components/admin/system-shell";

export const metadata = { robots: { index: false } };

export default function SystemLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SystemShell>{children}</SystemShell>
    </SessionProvider>
  );
}
