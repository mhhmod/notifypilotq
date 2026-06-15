import { DashboardShell } from "@/components/layout/dashboard-shell";
import { requireUser } from "@/lib/auth/session";
import { getTenant } from "@/lib/data/supabase-repository";
import { getSettings } from "@/services/settings/settings.service";

export default async function DashboardLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireUser();
  const [tenant, settings] = await Promise.all([getTenant(), getSettings()]);
  return (
    <DashboardShell
      user={user}
      storeName={settings.brand.storeName}
      storeCategory={tenant.storeCategory}
    >
      {children}
    </DashboardShell>
  );
}
