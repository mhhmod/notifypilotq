import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { LoginForm } from "@/components/auth/login-form";
import { BrandLogo } from "@/components/brand/brand-logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-background px-4 py-10">
      <div className="absolute end-4 top-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <BrandLogo variant="login" />
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Web push campaigns for e-commerce stores
          </p>
        </div>
        <Suspense fallback={<Skeleton className="h-80 w-full" />}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
