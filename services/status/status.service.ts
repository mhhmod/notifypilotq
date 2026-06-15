import {
  getIntegrationStatusFromData,
  listCampaignsFromData,
  listClicksFromData,
  listDiscountCodesFromData,
  listSubscribersFromData
} from "@/lib/data/supabase-repository";
import type { DashboardMetrics } from "@/types/domain";

export async function getSystemStatus() {
  return getIntegrationStatusFromData();
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const [subscribers, campaigns, discounts, clicks] = await Promise.all([
    listSubscribersFromData(),
    listCampaignsFromData(),
    listDiscountCodesFromData(),
    listClicksFromData()
  ]);
  const totalSubscribers = subscribers.length;
  const activeSubscribers = subscribers.filter((subscriber) => subscriber.status === "Active").length;
  const inactiveSubscribers = totalSubscribers - activeSubscribers;
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const newThisWeek = subscribers.filter(
    (subscriber) => new Date(subscriber.subscribedAt).getTime() >= weekAgo
  ).length;
  const newToday = subscribers.filter(
    (subscriber) => new Date(subscriber.subscribedAt).getTime() >= dayAgo
  ).length;
  const sentCampaigns = campaigns.filter((campaign) => campaign.status === "Sent");
  const totalClicks = clicks.length || campaigns.reduce((total, campaign) => total + campaign.clickCount, 0);
  const sentWithRate = sentCampaigns.filter((campaign) => campaign.sentCount > 0);
  const averageClickRate =
    sentWithRate.length > 0
      ? sentWithRate.reduce((total, campaign) => total + campaign.clickRate, 0) / sentWithRate.length
      : 0;
  const latestCampaign = campaigns[0];

  return {
    totalSubscribers,
    activeSubscribers,
    inactiveSubscribers,
    newThisWeek,
    newToday,
    optInConversionRate: totalSubscribers > 0 ? Math.round((discounts.length / totalSubscribers) * 1000) / 10 : 0,
    discountCodesIssued: discounts.filter((discount) => discount.status === "issued").length,
    campaignsSent: sentCampaigns.length,
    totalClicks,
    averageClickRate,
    lastCampaignStatus: latestCampaign?.status ?? "Draft"
  };
}

