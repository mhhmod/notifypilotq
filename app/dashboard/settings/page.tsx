import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge, statusTone } from "@/components/ui/badge";
import { getSettings } from "@/services/settings/settings.service";

function Row({
  label,
  value,
  badge
}: {
  label: string;
  value: string | number | boolean;
  badge?: boolean;
}) {
  const stringValue = typeof value === "boolean" ? (value ? "true" : "false") : String(value);
  return (
    <div className="flex flex-col gap-1 border-b border-border py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <dt className="text-sm font-semibold text-muted-foreground">{label}</dt>
      <dd className="break-words text-sm font-semibold text-foreground">
        {badge ? <Badge tone={statusTone(stringValue)}>{stringValue}</Badge> : stringValue}
      </dd>
    </div>
  );
}

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Manage your Shopify store integration and the subscriber opt-in discount offer."
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Store Integration" description="Your connected Shopify store." />
          <CardContent>
            <dl>
              <Row label="Store Name" value={settings.storeIntegration.storeName} />
              <Row label="Store URL" value={settings.storeIntegration.storeUrl} />
              <Row label="Platform" value={settings.storeIntegration.platform} />
              <Row label="Connection Status" value={settings.storeIntegration.connectionStatus} badge />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            title="Opt-in Discount Settings"
            description="Subscriber acquisition offer shown by the storefront push popup."
          />
          <CardContent>
            <dl>
              <Row label="Enable opt-in discount" value={settings.optInDiscount.enabled} badge />
              <Row label="Discount percentage" value={`${settings.optInDiscount.discountPercent}%`} />
              <Row label="Code prefix" value={settings.optInDiscount.codePrefix} />
              <Row label="Expiry hours" value={settings.optInDiscount.expiryHours} />
              <Row label="Popup title" value={settings.optInDiscount.popupTitle} />
              <Row label="Popup body" value={settings.optInDiscount.popupBody} />
              <Row label="Primary button text" value={settings.optInDiscount.primaryButtonText} />
              <Row label="Secondary button text" value={settings.optInDiscount.secondaryButtonText} />
              <Row label="Success title" value={settings.optInDiscount.successTitle} />
              <Row label="Success body" value={settings.optInDiscount.successBody} />
              <Row label="Apply discount redirect URL" value={settings.optInDiscount.applyDiscountRedirectUrl} />
              <Row label="Popup delay seconds" value={settings.optInDiscount.popupDelaySeconds} />
              <Row label="Re-show after dismiss hours" value={settings.optInDiscount.reShowAfterDismissHours} />
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
