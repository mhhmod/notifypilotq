"use client";

import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="rounded-lg border border-danger/20 bg-danger/5 p-6">
      <h2 className="text-base font-bold text-foreground">Unable to load this view</h2>
      <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
        {error.message || "Refresh the page or try again from the dashboard."}
      </p>
      <Button type="button" className="mt-4" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
