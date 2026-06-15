"use client";

import { useState } from "react";
import { PlugZap, RadioTower } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SettingsActions() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

  async function run(endpoint: string, label: string) {
    setLoading(label);
    const response = await fetch(endpoint, { method: "POST" });
    const data = (await response.json().catch(() => null)) as { status?: string; message?: string } | null;
    setMessage(data?.message ?? data?.status ?? "Request completed.");
    setLoading(null);
  }

  return (
    <div className="space-y-3">
      {message ? (
        <div className="rounded-md border border-accent/20 bg-accent/10 px-3 py-2 text-sm font-semibold text-accent">
          {message}
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          disabled={loading !== null}
          onClick={() => run("/api/shopify/test-connection", "shopify")}
        >
          <PlugZap className="h-4 w-4" />
          Test Store Connection
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={loading !== null}
          onClick={() => run("/api/n8n/test-connection", "n8n")}
        >
          <RadioTower className="h-4 w-4" />
          Test n8n connection
        </Button>
      </div>
    </div>
  );
}
