import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { LoginForm } from "@/components/auth/login-form";
import { GrindCtrlMark } from "@/components/brand/grindctrl-mark";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <section className="relative hidden overflow-hidden bg-sidebar p-12 text-sidebar-foreground lg:flex lg:flex-col lg:justify-between">
        <div className="np-login-aurora" aria-hidden />

        <div className="relative flex items-center gap-3">
          <GrindCtrlMark className="h-9 w-9 text-sidebar-foreground" />
          <span className="font-display text-lg font-extrabold tracking-tight">GrindCTRL</span>
        </div>

        <div className="relative max-w-md">
          <h1 className="text-balance font-display text-[2.6rem] font-extrabold leading-[1.04] tracking-tight">
            Push campaigns, run like operations.
          </h1>
          <p className="mt-5 max-w-sm text-pretty text-sm leading-7 text-sidebar-foreground/65">
            Collect browser subscribers and ship discounts, launches, and restock alerts from one
            calm, production-grade console.
          </p>
        </div>

        <div className="relative text-xs font-semibold tracking-wide text-sidebar-foreground/45">
          notify.grindctrl.cloud
        </div>
      </section>

      <section className="relative flex min-h-screen items-center justify-center px-5 py-10">
        <div className="absolute end-4 top-4">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <GrindCtrlMark className="h-9 w-9 text-foreground" />
            <span className="font-display text-lg font-extrabold tracking-tight text-foreground">
              GrindCTRL
            </span>
          </div>
          <Suspense fallback={<Skeleton className="h-80 w-full" />}>
            <LoginForm />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
