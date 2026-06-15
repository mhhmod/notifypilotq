import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function MetricCard({
  label,
  value,
  helper,
  icon: Icon
}: {
  label: string;
  value: string;
  helper?: string;
  icon: LucideIcon;
}) {
  return (
    <Card>
      <CardContent className="flex min-h-32 items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-muted-foreground">{label}</p>
          <p className="mt-3 text-3xl font-bold tracking-normal text-foreground">{value}</p>
          {helper ? <p className="mt-2 text-xs text-muted-foreground">{helper}</p> : null}
        </div>
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-accent/10 text-accent">
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}
