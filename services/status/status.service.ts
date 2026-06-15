import { getStore } from "@/lib/data/store";
import type { DashboardMetrics } from "@/types/domain";

export function getSystemStatus() {
  return getStore().integrationStatus;
}

export function getDashboardMetrics(): DashboardMetrics {
  const store = getStore();
  const totalSubscribers = store.subscribers.length;
  const activeSubscribers = store.subscribers.filter((subscriber) => subscriber.status === "Active").length;
  const inactiveSubscribers = totalSubscribers - activeSubscribers;
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const newThisWeek = store.subscribers.filter(
    (subscriber) => new Date(subscriber.subscribedAt).getTime() >= weekAgo
  ).length;
  const newToday = store.subscribers.filter(
    (subscriber) => new Date(subscriber.subscribedAt).getTime() >= dayAgo
  ).length;
  const sentCampaigns = store.campaigns.filter((campaign) => campaign.status === "Sent");
  const totalClicks = store.campaigns.reduce((total, campaign) => total + campaign.clickCount, 0);
  const sentWithRate = sentCampaigns.filter((campaign) => campaign.sentCount > 0);
  const averageClickRate =
    sentWithRate.length > 0
      ? sentWithRate.reduce((total, campaign) => total + campaign.clickRate, 0) / sentWithRate.length
      : 0;
  const latestCampaign = [...store.campaigns].sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  )[0];

  return {
    totalSubscribers,
    activeSubscribers,
    inactiveSubscribers,
    newThisWeek,
    newToday,
    optInConversionRate: totalSubscribers > 0 ? Math.round((store.discountCodes.length / totalSubscribers) * 1000) / 10 : 0,
    discountCodesIssued: store.discountCodes.filter((discount) => discount.status === "issued").length,
    campaignsSent: sentCampaigns.length,
    totalClicks,
    averageClickRate,
    lastCampaignStatus: latestCampaign?.status ?? "Draft"
  };
}
