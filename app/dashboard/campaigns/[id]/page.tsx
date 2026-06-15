import { notFound } from "next/navigation";
import { CalendarClock, CheckCircle2, MousePointerClick, Send, XCircle } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge, statusTone } from "@/components/ui/badge";
import { TableShell, Td, Th } from "@/components/ui/table";
import { formatDateTime, formatNumber, formatPercent } from "@/lib/utils";
import { getCampaign } from "@/services/campaigns/campaigns.service";

export default async function CampaignDetailsPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const details = getCampaign(id);
  if (!details) notFound();

  const { campaign, recipients, events, subscribers } = details;
  const subscribersById = new Map(subscribers.map((subscriber) => [subscriber.id, subscriber]));

  return (
    <div>
      <PageHeader
        title={campaign.name}
        description={`Created ${formatDateTime(campaign.createdAt)}${
          campaign.sentAt ? `, sent ${formatDateTime(campaign.sentAt)}` : ""
        }.`}
        action={<Badge tone={statusTone(campaign.status)}>{campaign.status}</Badge>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Total Recipients" value={formatNumber(campaign.totalRecipients)} icon={Send} />
        <MetricCard label="Sent Count" value={formatNumber(campaign.sentCount)} icon={CheckCircle2} />
        <MetricCard label="Failed Count" value={formatNumber(campaign.failedCount)} icon={XCircle} />
        <MetricCard label="Click Count" value={formatNumber(campaign.clickCount)} icon={MousePointerClick} />
        <MetricCard label="Click Rate" value={formatPercent(campaign.clickRate)} icon={CalendarClock} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(22rem,0.8fr)]">
        <div className="space-y-6">
          <Card>
            <CardHeader title="Overview" description="Notification content and destination." />
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-semibold text-muted-foreground">Notification title</dt>
                  <dd className="mt-1 text-sm font-semibold text-foreground">{campaign.notificationTitle}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-muted-foreground">Audience</dt>
                  <dd className="mt-1 text-sm font-semibold text-foreground">{campaign.audience}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs font-semibold text-muted-foreground">Notification body</dt>
                  <dd className="mt-1 text-sm leading-6 text-foreground">{campaign.notificationBody}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs font-semibold text-muted-foreground">Click URL</dt>
                  <dd className="mt-1 break-all text-sm font-semibold text-accent">{campaign.clickUrl}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Recipients" description="Delivery status for each selected subscriber." />
            <TableShell>
              <thead>
                <tr>
                  <Th>Subscriber</Th>
                  <Th>Status</Th>
                  <Th>Sent At</Th>
                  <Th>Clicked</Th>
                  <Th>Error</Th>
                </tr>
              </thead>
              <tbody>
                {recipients.map((recipient) => {
                  const subscriber = subscribersById.get(recipient.subscriberId);
                  return (
                    <tr key={recipient.id} className="hover:bg-muted/40">
                      <Td className="min-w-52 font-semibold text-foreground">
                        {subscriber?.displayName ?? "Subscriber"}
                      </Td>
                      <Td>
                        <Badge tone={statusTone(recipient.status)}>{recipient.status}</Badge>
                      </Td>
                      <Td className="min-w-40 text-muted-foreground">{formatDateTime(recipient.sentAt)}</Td>
                      <Td>{recipient.clicked ? "Yes" : "No"}</Td>
                      <Td className="min-w-44 text-muted-foreground">{recipient.error ?? "None"}</Td>
                    </tr>
                  );
                })}
              </tbody>
            </TableShell>
          </Card>
        </div>

        <Card>
          <CardHeader title="Events / Logs" description="Operational events for this campaign." />
          <CardContent>
            <div className="space-y-4">
              {events.map((event) => (
                <div key={event.id} className="rounded-md border border-border bg-muted/35 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-foreground">{event.eventType}</p>
                    <span className="text-xs text-muted-foreground">{formatDateTime(event.createdAt)}</span>
                  </div>
                  <p className="mt-2 text-sm leading-5 text-muted-foreground">{event.message}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
