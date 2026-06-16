"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Copy, Eye, Trash2, XCircle } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import type { CampaignStatus } from "@/types/domain";

export function CampaignActions({
  campaignId,
  status
}: {
  campaignId: string;
  status: CampaignStatus;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function post(action: "duplicate" | "cancel" | "delete") {
    setLoading(action);
    const response = await fetch(`/api/campaigns/${campaignId}/${action}`, { method: "POST" });
    const data = (await response.json().catch(() => null)) as { campaign?: { id: string } } | null;
    setLoading(null);
    if (action === "duplicate" && data?.campaign?.id) {
      router.push(`/dashboard/campaigns/${data.campaign.id}`);
      router.refresh();
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex min-w-56 flex-wrap gap-2">
      <ButtonLink href={`/dashboard/campaigns/${campaignId}`} variant="secondary" size="sm">
        <Eye className="h-3.5 w-3.5" />
        View
      </ButtonLink>
      <Button type="button" variant="secondary" size="sm" disabled={loading !== null} onClick={() => post("duplicate")}>
        <Copy className="h-3.5 w-3.5" />
        Duplicate
      </Button>
      {status === "Scheduled" ? (
        <Button type="button" variant="secondary" size="sm" disabled={loading !== null} onClick={() => post("cancel")}>
          <XCircle className="h-3.5 w-3.5" />
          Cancel
        </Button>
      ) : null}
      {status === "Draft" ? (
        <Button type="button" variant="ghost" size="sm" disabled={loading !== null} onClick={() => post("delete")}>
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </Button>
      ) : null}
    </div>
  );
}
