import { formatDateTime } from "@/lib/utils";
import type { PushEvent } from "@/types/domain";

export function RecentActivity({ events }: { events: PushEvent[] }) {
  return (
    <div className="space-y-4">
      {events.slice(0, 6).map((event) => (
        <div key={event.id} className="flex gap-3">
          <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-accent" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">{event.eventType}</p>
            <p className="mt-0.5 text-sm leading-5 text-muted-foreground">{event.message}</p>
            <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(event.createdAt)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
