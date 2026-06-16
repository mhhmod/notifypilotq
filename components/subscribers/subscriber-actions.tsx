"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Bell, Check, Clipboard, Loader2, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SubscriberActions({ subscriberId, discountCode }: { subscriberId: string; discountCode?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [copied, setCopied] = useState(false);

  async function run(action: "send-test" | "deactivate") {
    setLoading(action);
    setNote(null);
    try {
      const response = await fetch(`/api/subscribers/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriberId })
      });
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      if (action === "send-test") {
        setNote(
          response.ok
            ? { ok: true, text: "Test push sent" }
            : { ok: false, text: data?.error ?? "Test push failed" }
        );
      }
    } finally {
      setLoading(null);
      router.refresh();
    }
  }

  function copy() {
    if (!discountCode) return;
    navigator.clipboard.writeText(discountCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="min-w-60">
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" size="sm" disabled={loading !== null} onClick={() => run("send-test")}>
          {loading === "send-test" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Bell className="h-3.5 w-3.5" />}
          Send test push
        </Button>
        <Button type="button" variant="secondary" size="sm" disabled={loading !== null} onClick={() => run("deactivate")}>
          {loading === "deactivate" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserX className="h-3.5 w-3.5" />}
          Deactivate
        </Button>
        <Button type="button" variant="ghost" size="sm" disabled={!discountCode} onClick={copy}>
          {copied ? <Check className="h-3.5 w-3.5" /> : <Clipboard className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy code"}
        </Button>
      </div>
      {note ? (
        <div className={`mt-2 text-xs font-semibold ${note.ok ? "text-success" : "text-danger"}`}>{note.text}</div>
      ) : null}
    </div>
  );
}
