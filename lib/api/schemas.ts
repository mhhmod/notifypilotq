import { z } from "zod";

export const campaignInputSchema = z.object({
  name: z.string().min(1),
  notificationTitle: z.string().min(1),
  notificationBody: z.string().min(1),
  clickUrl: z.string().url(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  iconUrl: z.string().url().optional().or(z.literal("")),
  audience: z.enum(["Selected test subscribers", "All active subscribers"]),
  sendMode: z.enum(["Save as draft", "Send now", "Schedule for later"]),
  scheduledAt: z.string().optional()
});

export const sendLiveSchema = campaignInputSchema.extend({
  confirmation: z.string()
});

export const subscriberIdSchema = z.object({
  subscriberId: z.string().min(1)
});
