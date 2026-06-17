import { PageHeader } from "@/components/dashboard/page-header";
import { CreateCampaignWizard } from "@/components/campaigns/create-campaign-wizard";
import { getSettings } from "@/services/settings/settings.service";
import { listSubscriberGroups, listSubscribers } from "@/services/subscribers/subscribers.service";

export default async function NewCampaignPage() {
  const [subscribers, settings, groups] = await Promise.all([listSubscribers(), getSettings(), listSubscriberGroups()]);
  const activeSubscriberCount = subscribers.filter((subscriber) => subscriber.status === "Active").length;
  const testSubscriberCount = subscribers.filter(
    (subscriber) => subscriber.status === "Active" && subscriber.isOwnerAllowed
  ).length;

  return (
    <div>
      <PageHeader
        title="Create Campaign"
        description="Build, preview, test, and safely send a web push notification."
      />
      <CreateCampaignWizard
        activeSubscriberCount={activeSubscriberCount}
        testSubscriberCount={testSubscriberCount}
        liveSendingEnabled={settings.safety.liveSendingEnabled}
        storeName={settings.brand.storeName}
        defaultClickUrl={settings.brand.defaultClickUrl}
        groups={groups.map((group) => ({
          id: group.id,
          name: group.name,
          activeSubscriberCount: group.activeSubscriberCount
        }))}
      />
    </div>
  );
}



