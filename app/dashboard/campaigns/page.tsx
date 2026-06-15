import { Plus, Send, MousePointerClick, AlertTriangle, Percent } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { MetricCard } from "@/components/dashboard/metric-card";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge, statusTone } from "@/components/ui/badge";
import { TableShell, Td, Th } from "@/components/ui/table";
import { CampaignActions } from "@/components/campaigns/campaign-actions";
import { formatDateTime, formatNumber, formatPercent } from "@/lib/utils";
import { listCampaigns } from "@/services/campaigns/campaigns.service";

export default function CampaignsPage() {
  const campaigns = listCampaigns();
  const sent = campaigns.reduce((total, campaign) => total + campaign.sentCount, 0);
  const failed = campaigns.reduce((total, campaign) => total + campaign.failedCount, 0);
  const clicks = campaigns.reduce((total, campaign) => total + campaign.clickCount, 0);
  const sentCampaigns = campaigns.filter((campaign) => campaign.sentCount > 0);
  const averageRate =
    sentCampaigns.length > 0
      ? sentCampaigns.reduce((total, campaign) => total + campaign.clickRate, 0) / sentCampaigns.length
      : 0;

  return (
    <div>
      <PageHeader
        title="Campaigns"
        description="Create, review, duplicate, and manage web push campaigns for Aurela Studio."
        action={
          <ButtonLink href="/dashboard/campaigns/new">
            <Plus className="h-4 w-4" />
            Create Campaign
          </ButtonLink>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Sent" value={formatNumber(sent)} icon={Send} />
        <MetricCard label="Failed" value={formatNumber(failed)} icon={AlertTriangle} />
        <MetricCard label="Clicks" value={formatNumber(clicks)} icon={MousePointerClick} />
        <MetricCard label="Average Click Rate" value={formatPercent(averageRate)} icon={Percent} />
      </div>

      <Card className="mt-6">
        <CardHeader title="Campaign History" description="Delivery totals and engagement by campaign." />
        <TableShell>
          <thead>
            <tr>
              <Th>Campaign Name</Th>
              <Th>Status</Th>
              <Th>Audience</Th>
              <Th>Sent</Th>
              <Th>Failed</Th>
              <Th>Clicks</Th>
              <Th>Click Rate</Th>
              <Th>Created At</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((campaign) => (
              <tr key={campaign.id} className="hover:bg-muted/40">
                <Td className="min-w-60 font-semibold text-foreground">{campaign.name}</Td>
                <Td>
                  <Badge tone={statusTone(campaign.status)}>{campaign.status}</Badge>
                </Td>
                <Td className="min-w-44 text-muted-foreground">{campaign.audience}</Td>
                <Td>{formatNumber(campaign.sentCount)}</Td>
                <Td>{formatNumber(campaign.failedCount)}</Td>
                <Td>{formatNumber(campaign.clickCount)}</Td>
                <Td>{formatPercent(campaign.clickRate)}</Td>
                <Td className="min-w-40 text-muted-foreground">{formatDateTime(campaign.createdAt)}</Td>
                <Td>
                  <CampaignActions campaignId={campaign.id} status={campaign.status} />
                </Td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      </Card>
    </div>
  );
}
