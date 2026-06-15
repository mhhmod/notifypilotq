import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getStore } from "@/lib/data/store";
import { requireUser } from "@/lib/auth/session";

export default async function DashboardLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireUser();
  const store = getStore();
  return (
    <DashboardShell
      user={user}
      storeName={store.appSettings.brand.storeName}
      storeCategory={store.tenant.storeCategory}
    >
      {children}
    </DashboardShell>
  );
}
