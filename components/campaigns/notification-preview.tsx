import { Bell } from "lucide-react";

export function NotificationPreview({
  title,
  body,
  clickUrl,
  imageUrl,
  iconUrl,
  storeName,
  defaultClickUrl
}: {
  title: string;
  body: string;
  clickUrl: string;
  imageUrl?: string;
  iconUrl?: string;
  storeName: string;
  defaultClickUrl: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/60 p-4">
      <div className="mb-3 text-sm font-bold text-foreground">Live notification preview</div>
      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-card">
        {imageUrl ? (
          <div className="aspect-[16/7] w-full bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="" className="h-full w-full object-cover" />
          </div>
        ) : null}
        <div className="flex gap-3 p-4">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-accent/10 text-accent">
            {iconUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={iconUrl} alt="" className="h-7 w-7 rounded object-cover" />
            ) : (
              <Bell className="h-5 w-5" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-muted-foreground">{storeName}</div>
            <div className="mt-1 text-sm font-bold leading-5 text-foreground">
              {title || "Winter Drop is live"}
            </div>
            <div className="mt-1 text-sm leading-5 text-muted-foreground">
              {body || "Explore the latest pieces before they sell out."}
            </div>
            <div className="mt-3 truncate text-xs font-semibold text-accent">
              {clickUrl || defaultClickUrl}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



