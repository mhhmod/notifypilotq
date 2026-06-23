"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  Bell,
  Check,
  Clipboard,
  Globe,
  Loader2,
  MapPin,
  MonitorSmartphone,
  Plus,
  Radio,
  Ticket,
  UserX,
  Users,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/field";
import { Badge, statusTone } from "@/components/ui/badge";
import { formatDateTime, formatRelativeTime, getInitials } from "@/lib/utils";

type SubscriberActionGroup = {
  id: string;
  name: string;
  activeSubscriberCount: number;
};

export type SubscriberDetail = {
  email?: string;
  anonymous: boolean;
  status: string;
  browser: string;
  device: string;
  country: string;
  pushProvider: string;
  subscribedAt: string;
  lastSeenAt: string;
  discount?: {
    code: string;
    percent: number;
    status: string;
    expiresAt: string;
    usedAt?: string;
  };
};

export function SubscriberActions({
  subscriberId,
  displayName,
  discountCode,
  detail,
  groups,
  subscriberGroupIds
}: {
  subscriberId: string;
  displayName: string;
  discountCode?: string;
  detail: SubscriberDetail;
  groups: SubscriberActionGroup[];
  subscriberGroupIds: string[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(displayName);
  const [newGroupName, setNewGroupName] = useState("");

  async function run(action: "send-test" | "deactivate") {
    setLoading(action);
    setNote(null);
    try {
      const response = await fetch(`/api/subscribers/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriberId })
      });
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      if (action === "send-test") {
        setNote(response.ok ? { ok: true, text: "Test push sent" } : { ok: false, text: data?.error ?? "Test push failed" });
      }
    } finally {
      setLoading(null);
      router.refresh();
    }
  }

  async function updateName() {
    setLoading("profile");
    setNote(null);
    try {
      const response = await fetch("/api/subscribers/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriberId, displayName: name })
      });
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setNote(response.ok ? { ok: true, text: "Name saved" } : { ok: false, text: data?.error ?? "Name update failed" });
      if (response.ok) router.refresh();
    } finally {
      setLoading(null);
    }
  }

  async function setGroup(groupId: string, assigned: boolean) {
    setLoading(`group:${groupId}`);
    setNote(null);
    try {
      const response = await fetch("/api/subscribers/groups/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriberId, groupId, assigned })
      });
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setNote(response.ok ? { ok: true, text: assigned ? "Added to group" : "Removed from group" } : { ok: false, text: data?.error ?? "Group update failed" });
      if (response.ok) router.refresh();
    } finally {
      setLoading(null);
    }
  }

  async function createGroup() {
    setLoading("create-group");
    setNote(null);
    try {
      const response = await fetch("/api/subscribers/groups/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newGroupName })
      });
      const data = (await response.json().catch(() => null)) as { group?: { id: string }; error?: string } | null;
      if (!response.ok || !data?.group?.id) {
        setNote({ ok: false, text: data?.error ?? "Group creation failed" });
        return;
      }
      await setGroup(data.group.id, true);
      setNewGroupName("");
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  function copy(value?: string) {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const subtitle = detail.email ?? (detail.anonymous ? "Anonymous shopper" : "Shopper");

  return (
    <div className="min-w-48">
      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="secondary" size="sm" disabled={loading !== null} onClick={() => run("send-test")}>
          {loading === "send-test" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Bell className="h-3.5 w-3.5" />}
          Send test
        </Button>
        <Button type="button" variant="ghost" size="sm" disabled={!discountCode} onClick={() => copy(discountCode)}>
          {copied ? <Check className="h-3.5 w-3.5" /> : <Clipboard className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Code"}
        </Button>
        <Button type="button" size="sm" onClick={() => setOpen(true)}>
          Details
        </Button>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label={`Subscriber ${name}`}>
          <button
            type="button"
            aria-label="Close subscriber details"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-foreground/30 backdrop-blur-sm"
          />
          <aside
            className="relative flex h-full w-full max-w-md flex-col bg-card shadow-card"
          >
            {/* Identity header */}
            <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-accent/10 text-sm font-bold text-accent">
                  {getInitials(name) || "?"}
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-base font-bold text-foreground">{name}</h3>
                  <p className="truncate text-sm text-muted-foreground">{subtitle}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={statusTone(detail.status)}>{detail.status}</Badge>
                <Button type="button" variant="ghost" size="sm" aria-label="Close" onClick={() => setOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
              {/* Discount */}
              <Section icon={Ticket} title="Discount">
                {detail.discount ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <code className="rounded-md bg-muted px-2 py-1 font-mono text-sm font-semibold text-foreground">
                        {detail.discount.code}
                      </code>
                      <Button type="button" variant="ghost" size="sm" onClick={() => copy(detail.discount?.code)}>
                        {copied ? <Check className="h-3.5 w-3.5" /> : <Clipboard className="h-3.5 w-3.5" />}
                        {copied ? "Copied" : "Copy"}
                      </Button>
                    </div>
                    <Row label="Value" value={`${detail.discount.percent}% off`} />
                    <Row label="Status" value={<Badge tone={statusTone(detail.discount.status)}>{detail.discount.status}</Badge>} />
                    <Row label="Expires" value={formatDateTime(detail.discount.expiresAt)} />
                    {detail.discount.usedAt ? <Row label="Used" value={formatDateTime(detail.discount.usedAt)} /> : null}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No code issued yet — created automatically on opt-in.</p>
                )}
              </Section>

              {/* Device & channel */}
              <Section icon={MonitorSmartphone} title="Device & channel">
                <div className="space-y-3">
                  <Row label="Device" value={detail.device} />
                  <Row label="Browser" value={detail.browser} />
                  <Row label="Push provider" value={<span className="inline-flex items-center gap-1.5"><Radio className="h-3.5 w-3.5 text-muted-foreground" />{detail.pushProvider}</span>} />
                </div>
              </Section>

              {/* Location */}
              <Section icon={MapPin} title="Location">
                <Row label="Country" value={detail.country || "Not provided"} />
              </Section>

              {/* Lifecycle */}
              <Section icon={Globe} title="Lifecycle">
                <div className="space-y-3">
                  <Row label="Subscribed" value={`${formatDateTime(detail.subscribedAt)} · ${formatRelativeTime(detail.subscribedAt)}`} />
                  <Row label="Last seen" value={`${formatDateTime(detail.lastSeenAt)} · ${formatRelativeTime(detail.lastSeenAt)}`} />
                </div>
              </Section>

              {/* Name (edit) */}
              <Section icon={Users} title="Name & groups">
                <div className="space-y-4">
                  <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                    <input
                      aria-label="Subscriber name"
                      className={inputClass()}
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                    />
                    <Button type="button" size="sm" disabled={loading !== null || !name.trim()} onClick={updateName}>
                      {loading === "profile" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                      Save
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {groups.length > 0 ? (
                      groups.map((group) => {
                        const assigned = subscriberGroupIds.includes(group.id);
                        return (
                          <Button
                            key={group.id}
                            type="button"
                            variant={assigned ? "primary" : "secondary"}
                            size="sm"
                            disabled={loading !== null}
                            onClick={() => setGroup(group.id, !assigned)}
                          >
                            {loading === `group:${group.id}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                            {group.name}
                          </Button>
                        );
                      })
                    ) : (
                      <span className="text-sm text-muted-foreground">Create your first group below.</span>
                    )}
                  </div>
                  <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                    <input
                      className={inputClass()}
                      placeholder="New group name"
                      value={newGroupName}
                      onChange={(event) => setNewGroupName(event.target.value)}
                    />
                    <Button type="button" size="sm" disabled={loading !== null || !newGroupName.trim()} onClick={createGroup}>
                      {loading === "create-group" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                      Create
                    </Button>
                  </div>
                </div>
              </Section>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-4">
              {note ? (
                <span className={`text-sm font-semibold ${note.ok ? "text-success" : "text-danger"}`}>{note.text}</span>
              ) : (
                <span />
              )}
              <div className="flex items-center gap-2">
                <Button type="button" variant="danger" size="sm" disabled={loading !== null} onClick={() => run("deactivate")}>
                  {loading === "deactivate" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserX className="h-3.5 w-3.5" />}
                  Deactivate
                </Button>
                <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(false)}>
                  Done
                </Button>
              </div>
            </div>
          </aside>
        </div>
      ) : null}

      {note && !open ? (
        <div className={`mt-2 text-xs font-semibold ${note.ok ? "text-success" : "text-danger"}`}>{note.text}</div>
      ) : null}
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: typeof Ticket; title: string; children: ReactNode }) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {title}
      </div>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-semibold text-foreground">{value}</span>
    </div>
  );
}
