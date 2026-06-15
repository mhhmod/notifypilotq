import { BellRing, MousePointerClick, Percent, Send, Users, Ticket, UserPlus } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge, statusTone } from "@/components/ui/badge";
import { TableShell, Td, Th } from "@/components/ui/table";
import { PageHeader } from "@/components/dashboard/page-header";
import { MetricCard } from "@/components/dashboard/metric-card";
import { StatusList } from "@/components/dashboard/status-list";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { formatDateTime, formatNumber, formatPercent } from "@/lib/utils";
import { listCampaigns } from "@/services/campaigns/campaigns.service";
import { getStore } from "@/lib/data/store";
import { getDashboardMetrics, getSystemStatus } from "@/services/status/status.service";

export default function DashboardPage() {
  const metrics = getDashboardMetrics();
  const campaigns = listCampaigns();
  const status = getSystemStatus();
  const events = getStore().pushEvents;

  return (
    <div>
      <PageHeader
        title="Overview"
        description="Monitor Aurela Studio subscriber growth, campaign performance, and store connection readiness."
        action={<ButtonLink href="/dashboard/campaigns/new">Create Campaign</ButtonLink>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total Subscribers" value={formatNumber(metrics.totalSubscribers)} icon={Users} />
        <MetricCard label="Active Subscribers" value={formatNumber(metrics.activeSubscribers)} icon={BellRing} />
        <MetricCard label="New Subscribers Today" value={formatNumber(metrics.newToday)} icon={UserPlus} />
        <MetricCard label="Opt-in Conversion Rate" value={formatPercent(metrics.optInConversionRate)} icon={Percent} />
        <MetricCard label="10% Codes Issued" value={formatNumber(metrics.discountCodesIssued)} icon={Ticket} />
        <MetricCard label="Campaigns Sent" value={formatNumber(metrics.campaignsSent)} icon={Send} />
        <MetricCard label="Total Clicks" value={formatNumber(metrics.totalClicks)} icon={MousePointerClick} />
        <MetricCard label="Average Click Rate" value={formatPercent(metrics.averageClickRate)} icon={Percent} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(22rem,0.8fr)]">
        <Card>
          <CardHeader title="Recent Campaigns" description="Latest push campaigns and delivery outcomes." />
          <TableShell>
            <thead>
              <tr>
                <Th>Campaign Name</Th>
                <Th>Status</Th>
                <Th>Sent</Th>
                <Th>Failed</Th>
                <Th>Clicks</Th>
                <Th>Click Rate</Th>
                <Th>Created At</Th>
              </tr>
            </thead>
            <tbody>
              {campaigns.slice(0, 5).map((campaign) => (
                <tr key={campaign.id} className="hover:bg-muted/40">
                  <Td className="min-w-56 font-semibold text-foreground">{campaign.name}</Td>
                  <Td>
                    <Badge tone={statusTone(campaign.status)}>{campaign.status}</Badge>
                  </Td>
                  <Td>{formatNumber(campaign.sentCount)}</Td>
                  <Td>{formatNumber(campaign.failedCount)}</Td>
                  <Td>{formatNumber(campaign.clickCount)}</Td>
                  <Td>{formatPercent(campaign.clickRate)}</Td>
                  <Td className="min-w-40 text-muted-foreground">{formatDateTime(campaign.createdAt)}</Td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="System Status" description="Operational readiness for the current workspace." />
            <CardContent>
              <StatusList status={status} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader title="Recent Subscriber Activity" description="Latest campaign and subscriber events." />
            <CardContent>
              <RecentActivity events={events} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
