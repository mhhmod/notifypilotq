import { z } from "zod";

export const campaignInputSchema = z.object({
  name: z.string().min(1),
  notificationTitle: z.string().min(1),
  notificationBody: z.string().min(1),
  clickUrl: z.string().url(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  iconUrl: z.string().url().optional().or(z.literal("")),
  audience: z.enum(["Selected test subscribers", "All active subscribers", "Subscriber group"]),
  audienceGroupId: z.string().optional(),
  sendMode: z.enum(["Save as draft", "Send now", "Schedule for later"]),
  scheduledAt: z.string().optional()
});

export const sendLiveSchema = campaignInputSchema.extend({
  confirmation: z.string()
});

export const subscriberIdSchema = z.object({
  subscriberId: z.string().min(1)
});

export const subscriberProfileSchema = subscriberIdSchema.extend({
  displayName: z.string().min(1).max(120)
});

export const subscriberGroupCreateSchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(240).optional()
});

export const subscriberGroupAssignSchema = subscriberIdSchema.extend({
  groupId: z.string().min(1),
  assigned: z.boolean()
});
