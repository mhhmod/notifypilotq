import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { LoginForm } from "@/components/auth/login-form";
import { BrandLogo } from "@/components/brand/brand-logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <section className="relative hidden overflow-hidden bg-sidebar p-12 text-sidebar-foreground lg:flex lg:flex-col lg:justify-between">
        <div className="gc-login-aurora" aria-hidden />
        <BrandLogo variant="sidebar" className="relative z-10" />
        <div className="relative z-10 max-w-md">
          <h1 className="font-display text-4xl font-extrabold leading-[1.1] tracking-tight">
            Web push that converts.
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-6 text-sidebar-foreground/70">
            Reach every subscriber the moment it matters — campaigns, segments, and
            discounts from one calm console.
          </p>
        </div>
      </section>

      <section className="relative flex min-h-screen items-center justify-center px-5 py-10">
        <div className="absolute end-4 top-4">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-sm">
          <Suspense fallback={<Skeleton className="h-80 w-full" />}>
            <LoginForm />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
