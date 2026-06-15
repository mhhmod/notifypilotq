import { Badge, statusTone } from "@/components/ui/badge";
import type { IntegrationStatus } from "@/types/domain";

const statusRows: Array<[string, keyof IntegrationStatus]> = [
  ["Database", "database"],
  ["Campaign Engine", "campaignEngine"],
  ["Push Channel", "pushChannel"],
  ["Subscriber Collection", "subscriberCollection"],
  ["Storefront Script", "storefrontScript"],
  ["Shopify Connection", "shopifyConnection"],
  ["Live Sending", "liveSending"]
];

export function StatusList({ status }: { status: IntegrationStatus }) {
  return (
    <div className="divide-y divide-border">
      {statusRows.map(([label, key]) => {
        const value = String(status[key]);
        return (
          <div key={key} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
            <span className="text-sm font-semibold text-foreground">{label}</span>
            <Badge tone={statusTone(value)}>{value}</Badge>
          </div>
        );
      })}
    </div>
  );
}
