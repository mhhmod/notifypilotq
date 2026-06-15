"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Bell, Clipboard, Eye, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SubscriberActions({ subscriberId, discountCode }: { subscriberId: string; discountCode?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function run(action: "send-test" | "deactivate") {
    setLoading(action);
    await fetch(`/api/subscribers/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscriberId })
    });
    setLoading(null);
    router.refresh();
  }

  return (
    <div className="flex min-w-72 flex-wrap gap-2">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={loading !== null}
        onClick={() => run("send-test")}
      >
        <Bell className="h-3.5 w-3.5" />
        Send test push
      </Button>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={loading !== null}
        onClick={() => run("deactivate")}
      >
        <UserX className="h-3.5 w-3.5" />
        Deactivate
      </Button>
      <Button type="button" variant="ghost" size="sm" disabled={loading !== null}>
        <Eye className="h-3.5 w-3.5" />
        View activity
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={!discountCode}
        onClick={() => discountCode && navigator.clipboard.writeText(discountCode)}
      >
        <Clipboard className="h-3.5 w-3.5" />
        Copy code
      </Button>
    </div>
  );
}
