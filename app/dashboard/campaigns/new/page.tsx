import { PageHeader } from "@/components/dashboard/page-header";
import { CreateCampaignWizard } from "@/components/campaigns/create-campaign-wizard";
import { getSettings } from "@/services/settings/settings.service";
import { listSubscribers } from "@/services/subscribers/subscribers.service";

export default function NewCampaignPage() {
  const subscribers = listSubscribers();
  const settings = getSettings();
  const activeSubscriberCount = subscribers.filter((subscriber) => subscriber.status === "Active").length;
  const testSubscriberCount = subscribers.filter(
    (subscriber) => subscriber.status === "Active" && subscriber.isOwnerAllowed
  ).length;

  return (
    <div>
      <PageHeader
        title="Create Campaign"
        description="Build, preview, test, and safely send a web push notification for Aurela Studio."
      />
      <CreateCampaignWizard
        activeSubscriberCount={activeSubscriberCount}
        testSubscriberCount={testSubscriberCount}
        liveSendingEnabled={settings.safety.liveSendingEnabled}
      />
    </div>
  );
}
