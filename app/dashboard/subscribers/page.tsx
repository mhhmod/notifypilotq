import { BellRing, Clock, UserCheck, UserX } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Card, CardHeader } from "@/components/ui/card";
import { TableShell, Td, Th } from "@/components/ui/table";
import { Badge, statusTone } from "@/components/ui/badge";
import { SubscriberActions } from "@/components/subscribers/subscriber-actions";
import { formatDateTime, formatNumber, getInitials } from "@/lib/utils";
import { listDiscountCodesFromData } from "@/lib/data/supabase-repository";
import { getSubscriberSummary, listSubscribers } from "@/services/subscribers/subscribers.service";

export default async function SubscribersPage() {
  const [summary, subscribers, discounts] = await Promise.all([
    getSubscriberSummary(),
    listSubscribers(),
    listDiscountCodesFromData()
  ]);
  const discountsBySubscriber = new Map(
    discounts.map((discount) => [discount.subscriberId, discount])
  );

  return (
    <div>
      <PageHeader
        title="Subscribers"
        description="Review browser push subscribers without exposing private subscription credentials."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total Subscribers" value={formatNumber(summary.total)} icon={BellRing} />
        <MetricCard label="Active Subscribers" value={formatNumber(summary.active)} icon={UserCheck} />
        <MetricCard label="Inactive Subscribers" value={formatNumber(summary.inactive)} icon={UserX} />
        <MetricCard label="New This Week" value={formatNumber(summary.newThisWeek)} icon={Clock} />
      </div>

      <Card className="mt-6">
        <CardHeader
          title="Subscriber Directory"
          description="Device, browser, country, and engagement readiness for collected push subscribers."
        />
        <TableShell>
          <thead>
            <tr>
              <Th>Subscriber</Th>
              <Th>Browser</Th>
              <Th>Device</Th>
              <Th>Country</Th>
              <Th>Status</Th>
              <Th>Discount Code</Th>
              <Th>Code Status</Th>
              <Th>Subscribed At</Th>
              <Th>Last Seen</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {subscribers.map((subscriber) => {
              const discount = discountsBySubscriber.get(subscriber.id);
              return (
              <tr key={subscriber.id} className="hover:bg-muted/40">
                <Td className="min-w-52">
                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-accent/10 text-xs font-bold text-accent">
                      {getInitials(subscriber.displayName)}
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">{subscriber.displayName}</div>
                      <div className="text-xs text-muted-foreground">
                        {subscriber.browser} on {subscriber.device}
                      </div>
                    </div>
                  </div>
                </Td>
                <Td>{subscriber.browser}</Td>
                <Td>{subscriber.device}</Td>
                <Td className="min-w-44">{subscriber.country}</Td>
                <Td>
                  <Badge tone={statusTone(subscriber.status)}>{subscriber.status}</Badge>
                </Td>
                <Td className="min-w-44 font-mono text-xs font-semibold text-foreground">
                  {discount?.code ?? "Not issued"}
                </Td>
                <Td>
                  {discount ? (
                    <Badge tone={statusTone(discount.status)}>{discount.status}</Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground">Available after opt-in</span>
                  )}
                </Td>
                <Td className="min-w-40 text-muted-foreground">{formatDateTime(subscriber.subscribedAt)}</Td>
                <Td className="min-w-40 text-muted-foreground">{formatDateTime(subscriber.lastSeenAt)}</Td>
                <Td>
                  <SubscriberActions subscriberId={subscriber.id} discountCode={discount?.code} />
                </Td>
              </tr>
              );
            })}
          </tbody>
        </TableShell>
      </Card>
    </div>
  );
}



