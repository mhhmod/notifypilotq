import { cn } from "@/lib/utils";

const toneClass = {
  neutral: "border-border bg-muted text-muted-foreground",
  accent: "border-accent/25 bg-accent/10 text-accent",
  success: "border-success/25 bg-success/10 text-green-700",
  warning: "border-warning/30 bg-warning/15 text-amber-800",
  danger: "border-danger/25 bg-danger/10 text-red-700"
};

export type BadgeTone = keyof typeof toneClass;

export function Badge({
  children,
  tone = "neutral",
  className
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex min-h-6 items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        toneClass[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function statusTone(status: string): BadgeTone {
  if (["Sent", "Ready", "Connected", "Active", "Enabled", "Tested", "issued", "used"].includes(status)) {
    return "success";
  }
  if (
    [
      "Setup Required",
      "Pending Installation",
      "Not Configured",
      "Not Connected",
      "Disabled",
      "Scheduled",
      "Queued",
      "Draft",
      "Limited Mode",
      "expired"
    ].includes(status)
  ) {
    return "warning";
  }
  if (["Failed", "Cancelled", "Inactive", "cancelled"].includes(status)) return "danger";
  if (["Sending"].includes(status)) return "accent";
  return "neutral";
}
