import { BellRing, Clock, MapPin, MonitorSmartphone, UserCheck, UserX } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Card, CardHeader } from "@/components/ui/card";
import { TableShell, Td, Th } from "@/components/ui/table";
import { Badge, statusTone } from "@/components/ui/badge";
import { SubscriberActions } from "@/components/subscribers/subscriber-actions";
import { formatDateTime, formatNumber, getInitials } from "@/lib/utils";
import { listDiscountCodesFromData } from "@/lib/data/supabase-repository";
import {
  getSubscriberSummary,
  listSubscriberGroupMemberships,
  listSubscriberGroups,
  listSubscribers
} from "@/services/subscribers/subscribers.service";

export default async function SubscribersPage() {
  const [summary, subscribers, discounts, groups, memberships] = await Promise.all([
    getSubscriberSummary(),
    listSubscribers(),
    listDiscountCodesFromData(),
    listSubscriberGroups(),
    listSubscriberGroupMemberships()
  ]);
  const discountsBySubscriber = new Map(
    discounts.map((discount) => [discount.subscriberId, discount])
  );
  const groupsById = new Map(groups.map((group) => [group.id, group]));
  const groupIdsBySubscriber = new Map<string, string[]>();
  memberships.forEach((membership) => {
    const current = groupIdsBySubscriber.get(membership.subscriberId) ?? [];
    current.push(membership.groupId);
    groupIdsBySubscriber.set(membership.subscriberId, current);
  });

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
              <Th>Groups</Th>
              <Th>Discount Code</Th>
              <Th>Readiness</Th>
              <Th>Timeline</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {subscribers.map((subscriber) => {
              const discount = discountsBySubscriber.get(subscriber.id);
              const subscriberGroupIds = groupIdsBySubscriber.get(subscriber.id) ?? [];
              const subscriberGroups = subscriberGroupIds
                .map((groupId) => groupsById.get(groupId))
                .filter((group): group is NonNullable<typeof group> => Boolean(group));
              return (
              <tr key={subscriber.id} className="hover:bg-muted/40">
                <Td className="min-w-72">
                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-accent/10 text-xs font-bold text-accent">
                      {getInitials(subscriber.displayName)}
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">{subscriber.displayName}</div>
                      <div className="text-xs text-muted-foreground">
                        {subscriber.browser} on {subscriber.device}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <MonitorSmartphone className="h-3.5 w-3.5" />
                          {subscriber.browser} / {subscriber.device}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {subscriber.country}
                        </span>
                      </div>
                    </div>
                  </div>
                </Td>
                <Td className="min-w-48">
                  <div className="flex flex-wrap gap-1.5">
                    {subscriberGroups.length > 0 ? (
                      subscriberGroups.map((group) => (
                        <Badge key={group.id} tone="accent">{group.name}</Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">No group</span>
                    )}
                  </div>
                </Td>
                <Td className="min-w-44">
                  <div className="font-mono text-xs font-semibold text-foreground">{discount?.code ?? "Not issued"}</div>
                  <div className="mt-1">
                    {discount ? (
                      <Badge tone={statusTone(discount.status)}>{discount.status}</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">Available after opt-in</span>
                    )}
                  </div>
                </Td>
                <Td className="min-w-32">
                  <Badge tone={statusTone(subscriber.status)}>{subscriber.status}</Badge>
                </Td>
                <Td className="min-w-48 text-sm text-muted-foreground">
                  <div>
                    <span className="font-semibold text-foreground">Subscribed</span>
                    <div>{formatDateTime(subscriber.subscribedAt)}</div>
                  </div>
                  <div className="mt-2">
                    <span className="font-semibold text-foreground">Last seen</span>
                    <div>{formatDateTime(subscriber.lastSeenAt)}</div>
                  </div>
                </Td>
                <Td className="text-right">
                  <SubscriberActions
                    subscriberId={subscriber.id}
                    displayName={subscriber.displayName}
                    discountCode={discount?.code}
                    groups={groups.map((group) => ({
                      id: group.id,
                      name: group.name,
                      activeSubscriberCount: group.activeSubscriberCount
                    }))}
                    subscriberGroupIds={subscriberGroupIds}
                  />
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



