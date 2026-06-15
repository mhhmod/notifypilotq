"use client";

import { useState } from "react";
import { CheckCircle2, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/confirm-modal";

const checklist = [
  "Get Shopify collaborator access",
  "Create custom app / access token",
  "Enable Admin API scopes",
  "Add webhook endpoints",
  "Install storefront script",
  "Add service worker",
  "Test subscriber collection",
  "Test campaign click URL",
  "Enable connected mode"
];

export function IntegrationChecklist() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
        <ClipboardList className="h-4 w-4" />
        View Store Integration Checklist
      </Button>
      <ConfirmModal
        open={open}
        title="Store Integration Checklist"
        description="Complete these steps before enabling the Shopify connection."
        confirmLabel="Done"
        onConfirm={() => setOpen(false)}
        onClose={() => setOpen(false)}
      >
        <div className="space-y-3">
          {checklist.map((item) => (
            <div key={item} className="flex items-center gap-3 rounded-md border border-border bg-muted/35 px-3 py-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">{item}</span>
            </div>
          ))}
        </div>
      </ConfirmModal>
    </>
  );
}
