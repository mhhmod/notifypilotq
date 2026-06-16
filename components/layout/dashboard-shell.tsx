"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  BellPlus,
  Megaphone,
  Menu,
  Settings,
  Users,
  X
} from "lucide-react";
import { useState } from "react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/auth/session";

const navItems = [
  { label: "Overview", href: "/dashboard", icon: BarChart3 },
  { label: "Subscribers", href: "/dashboard/subscribers", icon: Users },
  { label: "Campaigns", href: "/dashboard/campaigns", icon: Megaphone },
  { label: "Create Campaign", href: "/dashboard/campaigns/new", icon: BellPlus },
  { label: "Settings", href: "/dashboard/settings", icon: Settings }
];

function SidebarContent({
  storeName,
  onNavigate
}: {
  storeName: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();

  // Only the most specific matching nav item is active, so /dashboard/campaigns/new
  // highlights "Create Campaign" alone, not "Campaigns" too.
  const activeHref = navItems
    .filter((item) =>
      item.href === "/dashboard"
        ? pathname === "/dashboard"
        : pathname === item.href || pathname.startsWith(`${item.href}/`)
    )
    .reduce((best, item) => (item.href.length > best.length ? item.href : best), "");

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex h-full flex-col">
      <div className="px-5 py-5">
        <BrandLogo subtitle={storeName} />
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {navItems.map((item) => {
          const active = item.href === activeHref;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition",
                active
                  ? "bg-sidebar-foreground/15 text-sidebar-foreground"
                  : "text-sidebar-foreground/65 hover:bg-sidebar-foreground/8 hover:text-sidebar-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-foreground/12 p-4">
        <button
          type="button"
          onClick={logout}
          className="w-full rounded-md px-3 py-2 text-left text-sm font-semibold text-sidebar-foreground/65 transition hover:bg-sidebar-foreground/8 hover:text-sidebar-foreground"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

export function DashboardShell({
  children,
  user,
  storeName,
  storeCategory
}: {
  children: React.ReactNode;
  user: SessionUser;
  storeName: string;
  storeCategory: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 bg-sidebar lg:block">
        <SidebarContent storeName={storeName} />
      </aside>

      <div className="lg:ps-72">
        <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
          <div className="flex min-h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <button
              type="button"
              className="rounded-md border border-border bg-card p-2 text-foreground lg:hidden"
              aria-label="Open navigation"
              onClick={() => setOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <div className="truncate text-sm font-bold">{storeName}</div>
              <div className="truncate text-xs text-muted-foreground">{storeCategory}</div>
            </div>
            <div className="ms-auto flex items-center gap-3">
              <ThemeToggle />
              <div className="hidden text-right sm:block">
                <div className="text-sm font-semibold">{user.displayName}</div>
                <div className="text-xs text-muted-foreground">{user.role}</div>
              </div>
            </div>
          </div>
        </header>
        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-sidebar/55"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
          />
          <aside className="relative h-full w-[min(20rem,calc(100vw-2rem))] bg-sidebar shadow-card">
            <button
              type="button"
              aria-label="Close navigation"
              className="absolute end-3 top-3 rounded-md p-2 text-sidebar-foreground/70 hover:bg-sidebar-foreground/8 hover:text-sidebar-foreground"
              onClick={() => setOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent storeName={storeName} onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      ) : null}
    </div>
  );
}


