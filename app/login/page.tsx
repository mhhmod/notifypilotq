import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { LoginForm } from "@/components/auth/login-form";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <section
        className="relative hidden overflow-hidden bg-sidebar p-12 text-sidebar-foreground lg:block"
        aria-hidden="true"
      >
        <div className="np-login-aurora" aria-hidden />
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
