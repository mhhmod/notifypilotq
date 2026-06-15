import { LockKeyhole, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IntegrationChecklist } from "@/components/settings/integration-checklist";
import { SettingsActions } from "@/components/settings/settings-actions";
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
        description="Manage brand defaults, push readiness, store integration, n8n connection, and live-send safety."
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Brand Settings" description="Default store identity used across notifications." />
          <CardContent>
            <dl>
              <Row label="Store name" value={settings.brand.storeName} />
              <Row label="Store URL" value={settings.brand.storeUrl} />
              <Row label="Default notification icon" value={settings.brand.defaultNotificationIcon} />
              <Row label="Default click URL" value={settings.brand.defaultClickUrl} />
              <Row label="Timezone" value={settings.brand.timezone} />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Push Settings" description="Push key and service worker readiness." />
          <CardContent>
            <dl>
              <Row label="VAPID public key" value={settings.push.vapidPublicKey} />
              <Row label="VAPID private key" value={settings.push.vapidPrivateKeyMasked} />
              <Row label="VAPID subject" value={settings.push.vapidSubject} />
              <Row label="Service worker status" value={settings.push.serviceWorkerStatus} badge />
              <Row label="Subscriber collection status" value={settings.push.subscriberCollectionStatus} badge />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Store Integration" description="Shopify setup and storefront installation status." />
          <CardContent>
            <dl>
              <Row label="Store Name" value={settings.storeIntegration.storeName} />
              <Row label="Store URL" value={settings.storeIntegration.storeUrl} />
              <Row label="Platform" value={settings.storeIntegration.platform} />
              <Row label="Connection Status" value={settings.storeIntegration.connectionStatus} badge />
              <Row label="Storefront Script" value={settings.storeIntegration.storefrontScript} badge />
              <Row label="Webhooks" value={settings.storeIntegration.webhooks} badge />
              <Row label="Admin API" value={settings.storeIntegration.adminApi} badge />
              <Row
                label="Discount Creation"
                value={settings.storeIntegration.discountCreationStatus ?? "Shopify Connection Required"}
                badge
              />
              <Row
                label="Orders Webhook"
                value={settings.storeIntegration.ordersWebhookStatus ?? "Not Configured"}
                badge
              />
              <Row
                label="Push Channel"
                value={settings.storeIntegration.pushChannelStatus ?? "Ready"}
                badge
              />
            </dl>
            <div className="mt-5 flex flex-wrap gap-2">
              <IntegrationChecklist />
              <Button type="button" disabled>
                Configuration Required
              </Button>
            </div>
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

        <Card>
          <CardHeader title="n8n Connection" description="Campaign sender workflow status." />
          <CardContent>
            <dl>
              <Row label="n8n base URL" value={settings.n8n.baseUrl} />
              <Row label="Campaign sender webhook status" value={settings.n8n.campaignSenderWebhookStatus} badge />
              <Row label="Last workflow run" value={settings.n8n.lastWorkflowRun} />
            </dl>
            <div className="mt-5">
              <SettingsActions />
            </div>
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader
            title="Safety Settings"
            description="Send controls that keep live delivery conservative until the store connection is fully prepared."
            action={
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-success" />
                Require SEND confirmation
              </div>
            }
          />
          <CardContent>
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
              <dl>
                <Row label="Owner Test Mode" value={settings.safety.ownerTestMode} />
                <Row label="Live Sending Enabled" value={settings.safety.liveSendingEnabled} badge />
                <Row label="Max sends per hour" value={settings.safety.maxSendsPerHour} />
                <Row label="Require SEND confirmation" value={settings.safety.requireSendConfirmation} />
                <Row label="Allowed test subscribers" value={settings.safety.allowedTestSubscribers.join(", ")} />
              </dl>
              <div className="rounded-lg border border-warning/30 bg-warning/10 p-4">
                <div className="flex items-center gap-2">
                  <LockKeyhole className="h-4 w-4 text-amber-800" />
                  <h3 className="text-sm font-bold text-amber-900">Live Sending Disabled</h3>
                </div>
                <p className="mt-2 text-sm leading-6 text-amber-900">
                  Campaigns can be saved and sent to selected test subscribers. Full audience live sending remains locked until enabled in safety settings.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
