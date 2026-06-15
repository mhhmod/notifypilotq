"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { Field, inputClass, textareaClass } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { NotificationPreview } from "@/components/campaigns/notification-preview";
import { isValidUrl } from "@/lib/utils";
import type { AudienceType, SendMode } from "@/types/domain";

interface FormState {
  name: string;
  notificationTitle: string;
  notificationBody: string;
  clickUrl: string;
  imageUrl: string;
  iconUrl: string;
  audience: AudienceType;
  sendMode: SendMode;
  date: string;
  time: string;
  timezone: string;
}

const initialState: FormState = {
  name: "",
  notificationTitle: "",
  notificationBody: "",
  clickUrl: "",
  imageUrl: "",
  iconUrl: "",
  audience: "Selected test subscribers",
  sendMode: "Save as draft",
  date: "",
  time: "",
  timezone: "Africa/Cairo"
};

const steps = ["Content", "Audience", "Schedule", "Review"];

export function CreateCampaignWizard({
  activeSubscriberCount,
  testSubscriberCount,
  liveSendingEnabled
}: {
  activeSubscriberCount: number;
  testSubscriberCount: number;
  liveSendingEnabled: boolean;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string>("");
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const estimatedRecipients = form.audience === "All active subscribers" ? activeSubscriberCount : testSubscriberCount;
  const liveAllowed = liveSendingEnabled || form.audience === "Selected test subscribers";

  const scheduledAt = useMemo(() => {
    if (form.sendMode !== "Schedule for later" || !form.date || !form.time) return undefined;
    return new Date(`${form.date}T${form.time}:00`).toISOString();
  }, [form.date, form.sendMode, form.time]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: "" }));
  }

  function validateContent() {
    const nextErrors: Record<string, string> = {};
    if (!form.name.trim()) nextErrors.name = "Campaign name is required.";
    if (!form.notificationTitle.trim()) nextErrors.notificationTitle = "Title is required.";
    if (!form.notificationBody.trim()) nextErrors.notificationBody = "Body is required.";
    if (!form.clickUrl.trim()) nextErrors.clickUrl = "Click URL is required.";
    if (form.clickUrl.trim() && !isValidUrl(form.clickUrl)) nextErrors.clickUrl = "Click URL must be a valid URL.";
    if (form.imageUrl.trim() && !isValidUrl(form.imageUrl)) nextErrors.imageUrl = "Image URL must be a valid URL.";
    if (form.iconUrl.trim() && !isValidUrl(form.iconUrl)) nextErrors.iconUrl = "Icon URL must be a valid URL.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function validateSchedule() {
    if (form.sendMode === "Schedule for later" && (!form.date || !form.time)) {
      setErrors({ schedule: "Choose a date and time for scheduled sending." });
      return false;
    }
    return true;
  }

  function next() {
    if (step === 0 && !validateContent()) return;
    if (step === 2 && !validateSchedule()) return;
    setStep((current) => Math.min(current + 1, steps.length - 1));
  }

  function payload(extra?: Record<string, unknown>) {
    return {
      name: form.name,
      notificationTitle: form.notificationTitle,
      notificationBody: form.notificationBody,
      clickUrl: form.clickUrl,
      imageUrl: form.imageUrl || undefined,
      iconUrl: form.iconUrl || undefined,
      audience: form.audience,
      sendMode: form.sendMode,
      scheduledAt,
      ...extra
    };
  }

  async function submit(action: "draft" | "test" | "live", confirmation?: string) {
    if (!validateContent() || !validateSchedule()) return;
    setSubmitting(action);
    setMessage("");

    const endpoint =
      action === "draft"
        ? "/api/campaigns/create"
        : action === "test"
          ? "/api/campaigns/send-test"
          : "/api/campaigns/send-live";
    const body =
      action === "draft"
        ? payload({ sendMode: "Save as draft" })
        : action === "test"
          ? payload({ audience: "Selected test subscribers", sendMode: "Send now" })
          : payload({ confirmation });

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const data = (await response.json().catch(() => null)) as { campaign?: { id: string }; error?: string } | null;
    setSubmitting(null);

    if (!response.ok) {
      setMessage(data?.error ?? "Unable to complete this action.");
      return;
    }

    if (data?.campaign?.id) {
      router.push(`/dashboard/campaigns/${data.campaign.id}`);
      router.refresh();
      return;
    }

    setMessage("Campaign action completed.");
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
      <Card>
        <CardContent>
          <div className="mb-6 flex flex-wrap gap-2">
            {steps.map((item, index) => (
              <button
                key={item}
                type="button"
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold ${
                  index === step
                    ? "border-accent bg-accent text-accent-foreground"
                    : index < step
                      ? "border-success/25 bg-success/10 text-green-700"
                      : "border-border bg-muted text-muted-foreground"
                }`}
                onClick={() => setStep(index)}
              >
                {index < step ? <Check className="h-3.5 w-3.5" /> : <span>{index + 1}</span>}
                {item}
              </button>
            ))}
          </div>

          {message ? (
            <div className="mb-5 rounded-md border border-warning/30 bg-warning/10 px-4 py-3 text-sm font-semibold text-amber-800">
              {message}
            </div>
          ) : null}

          {step === 0 ? (
            <div className="grid gap-4">
              <Field label="Campaign name" htmlFor="name" error={errors.name}>
                <input
                  id="name"
                  className={inputClass(Boolean(errors.name))}
                  placeholder="Winter Drop Early Access"
                  value={form.name}
                  onChange={(event) => update("name", event.target.value)}
                />
              </Field>
              <Field
                label="Notification title"
                htmlFor="title"
                helper={`${form.notificationTitle.length}/60 characters recommended`}
                error={errors.notificationTitle}
              >
                <input
                  id="title"
                  className={inputClass(Boolean(errors.notificationTitle))}
                  placeholder="Winter Drop is live"
                  value={form.notificationTitle}
                  maxLength={90}
                  onChange={(event) => update("notificationTitle", event.target.value)}
                />
              </Field>
              <Field
                label="Notification body"
                htmlFor="body"
                helper={`${form.notificationBody.length}/140 characters recommended`}
                error={errors.notificationBody}
              >
                <textarea
                  id="body"
                  className={textareaClass(Boolean(errors.notificationBody))}
                  placeholder="Explore the latest pieces before they sell out."
                  value={form.notificationBody}
                  maxLength={180}
                  onChange={(event) => update("notificationBody", event.target.value)}
                />
              </Field>
              <Field label="Click URL" htmlFor="clickUrl" error={errors.clickUrl}>
                <input
                  id="clickUrl"
                  className={inputClass(Boolean(errors.clickUrl))}
                  placeholder="https://aurelastudio.com/collections/new-arrivals"
                  value={form.clickUrl}
                  onChange={(event) => update("clickUrl", event.target.value)}
                />
              </Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Optional image URL" htmlFor="imageUrl" error={errors.imageUrl}>
                  <input
                    id="imageUrl"
                    className={inputClass(Boolean(errors.imageUrl))}
                    value={form.imageUrl}
                    onChange={(event) => update("imageUrl", event.target.value)}
                  />
                </Field>
                <Field label="Optional icon URL" htmlFor="iconUrl" error={errors.iconUrl}>
                  <input
                    id="iconUrl"
                    className={inputClass(Boolean(errors.iconUrl))}
                    value={form.iconUrl}
                    onChange={(event) => update("iconUrl", event.target.value)}
                  />
                </Field>
              </div>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="grid gap-3">
              {(["Selected test subscribers", "All active subscribers"] as AudienceType[]).map((audience) => (
                <label key={audience} className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-4 hover:bg-muted/50">
                  <input
                    type="radio"
                    name="audience"
                    className="mt-1"
                    checked={form.audience === audience}
                    onChange={() => update("audience", audience)}
                  />
                  <span>
                    <span className="block text-sm font-bold text-foreground">{audience}</span>
                    <span className="mt-1 block text-sm text-muted-foreground">
                      Estimated recipients: {audience === "All active subscribers" ? activeSubscriberCount : testSubscriberCount}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          ) : null}

          {step === 2 ? (
            <div className="grid gap-4">
              {(["Save as draft", "Send now", "Schedule for later"] as SendMode[]).map((mode) => (
                <label key={mode} className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-4 hover:bg-muted/50">
                  <input
                    type="radio"
                    name="sendMode"
                    checked={form.sendMode === mode}
                    onChange={() => update("sendMode", mode)}
                  />
                  <span className="text-sm font-bold text-foreground">{mode}</span>
                </label>
              ))}
              {form.sendMode === "Schedule for later" ? (
                <div className="grid gap-4 rounded-lg border border-border bg-muted/40 p-4 md:grid-cols-3">
                  <Field label="Date" htmlFor="date">
                    <input
                      id="date"
                      type="date"
                      className={inputClass(Boolean(errors.schedule))}
                      value={form.date}
                      onChange={(event) => update("date", event.target.value)}
                    />
                  </Field>
                  <Field label="Time" htmlFor="time">
                    <input
                      id="time"
                      type="time"
                      className={inputClass(Boolean(errors.schedule))}
                      value={form.time}
                      onChange={(event) => update("time", event.target.value)}
                    />
                  </Field>
                  <Field label="Timezone" htmlFor="timezone" error={errors.schedule}>
                    <input
                      id="timezone"
                      className={inputClass(Boolean(errors.schedule))}
                      value={form.timezone}
                      onChange={(event) => update("timezone", event.target.value)}
                    />
                  </Field>
                </div>
              ) : null}
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <ReviewRow label="Campaign name" value={form.name} />
                <ReviewRow label="Audience" value={form.audience} />
                <ReviewRow label="Notification title" value={form.notificationTitle} />
                <ReviewRow label="Estimated recipients" value={String(estimatedRecipients)} />
                <ReviewRow label="Notification body" value={form.notificationBody} wide />
                <ReviewRow label="Click URL" value={form.clickUrl} wide />
                <ReviewRow label="Send mode" value={form.sendMode} />
                <ReviewRow label="Timezone" value={form.timezone} />
              </div>
              <NotificationPreview
                title={form.notificationTitle}
                body={form.notificationBody}
                clickUrl={form.clickUrl}
                imageUrl={form.imageUrl}
                iconUrl={form.iconUrl}
              />
              <div className="rounded-lg border border-warning/30 bg-warning/10 p-4">
                <div className="flex items-center gap-2">
                  <Badge tone={liveAllowed ? "success" : "warning"}>{liveAllowed ? "Send allowed" : "Live Sending Disabled"}</Badge>
                  <span className="text-sm text-amber-900">
                    Send Live is available for selected test subscribers or when Live Sending Enabled is true.
                  </span>
                </div>
              </div>
            </div>
          ) : null}

          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
            <Button type="button" variant="secondary" disabled={step === 0} onClick={() => setStep((current) => Math.max(0, current - 1))}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            {step < 3 ? (
              <Button type="button" onClick={next}>
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <div className="flex flex-wrap justify-end gap-2">
                <Button type="button" variant="secondary" disabled={submitting !== null} onClick={() => submit("draft")}>
                  {submitting === "draft" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Save Draft
                </Button>
                <Button type="button" variant="secondary" disabled={submitting !== null} onClick={() => submit("test")}>
                  {submitting === "test" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Send Test
                </Button>
                <Button type="button" disabled={!liveAllowed || submitting !== null} onClick={() => setConfirmOpen(true)}>
                  <Send className="h-4 w-4" />
                  Send Live
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="xl:sticky xl:top-24 xl:self-start">
        <NotificationPreview
          title={form.notificationTitle}
          body={form.notificationBody}
          clickUrl={form.clickUrl}
          imageUrl={form.imageUrl}
          iconUrl={form.iconUrl}
        />
        <Card className="mt-4">
          <CardContent>
            <div className="text-sm font-bold text-foreground">Recipient estimate</div>
            <div className="mt-3 text-3xl font-bold">{estimatedRecipients}</div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{form.audience}</p>
          </CardContent>
        </Card>
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="Confirm live send"
        description={`You are about to send this notification to ${estimatedRecipients} subscribers. This action cannot be undone after sending starts.`}
        confirmLabel="Send Live"
        confirmDisabled={confirmText !== "SEND" || submitting !== null}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          submit("live", confirmText);
        }}
      >
        <Field label="Type SEND to confirm" htmlFor="sendConfirm">
          <input
            id="sendConfirm"
            className={inputClass()}
            value={confirmText}
            onChange={(event) => setConfirmText(event.target.value)}
            autoComplete="off"
          />
        </Field>
      </ConfirmModal>
    </div>
  );
}

function ReviewRow({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <div className="text-xs font-semibold text-muted-foreground">{label}</div>
      <div className="mt-1 break-words text-sm font-semibold text-foreground">{value || "Not provided"}</div>
    </div>
  );
}
