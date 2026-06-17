"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Bell, Check, Clipboard, Loader2, Pencil, Plus, UserX, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/field";

type SubscriberActionGroup = {
  id: string;
  name: string;
  activeSubscriberCount: number;
};

export function SubscriberActions({
  subscriberId,
  displayName,
  discountCode,
  groups,
  subscriberGroupIds
}: {
  subscriberId: string;
  displayName: string;
  discountCode?: string;
  groups: SubscriberActionGroup[];
  subscriberGroupIds: string[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
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
        setNote(
          response.ok
            ? { ok: true, text: "Test push sent" }
            : { ok: false, text: data?.error ?? "Test push failed" }
        );
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

  function copy() {
    if (!discountCode) return;
    navigator.clipboard.writeText(discountCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="min-w-60">
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" size="sm" disabled={loading !== null} onClick={() => run("send-test")}>
          {loading === "send-test" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Bell className="h-3.5 w-3.5" />}
          Send test push
        </Button>
        <Button type="button" variant="secondary" size="sm" disabled={loading !== null} onClick={() => run("deactivate")}>
          {loading === "deactivate" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserX className="h-3.5 w-3.5" />}
          Deactivate
        </Button>
        <Button type="button" variant="ghost" size="sm" disabled={!discountCode} onClick={copy}>
          {copied ? <Check className="h-3.5 w-3.5" /> : <Clipboard className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy code"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setManageOpen((open) => !open)}>
          <Pencil className="h-3.5 w-3.5" />
          Manage
        </Button>
      </div>
      {manageOpen ? (
        <div className="mt-3 max-w-80 rounded-md border border-border bg-background p-3">
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground" htmlFor={`subscriber-name-${subscriberId}`}>
              Subscriber name
            </label>
            <div className="flex gap-2">
              <input
                id={`subscriber-name-${subscriberId}`}
                className={inputClass()}
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
              <Button type="button" size="sm" disabled={loading !== null || !name.trim()} onClick={updateName}>
                {loading === "profile" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Save
              </Button>
            </div>
          </div>
          <div className="mt-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-bold text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              Groups
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
                <span className="text-xs text-muted-foreground">Create your first group below.</span>
              )}
            </div>
          </div>
          <div className="mt-3 flex gap-2">
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
      ) : null}
      {note ? (
        <div className={`mt-2 text-xs font-semibold ${note.ok ? "text-success" : "text-danger"}`}>{note.text}</div>
      ) : null}
    </div>
  );
}
