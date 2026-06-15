import { cn } from "@/lib/utils";

type BrandLogoVariant = "sidebar" | "login" | "compact";

export function BrandLogo({
  variant = "sidebar",
  className
}: {
  variant?: BrandLogoVariant;
  className?: string;
}) {
  const compact = variant === "compact";
  const login = variant === "login";

  return (
    <div
      className={cn(
        "flex items-center gap-3",
        compact && "gap-2",
        login && "flex-col justify-center text-center",
        className
      )}
    >
      <div
        className={cn(
          "relative grid place-items-center overflow-hidden rounded-lg border border-[oklch(0.985_0.006_262_/_0.18)] bg-[oklch(var(--brand-mark))] text-[oklch(var(--brand-mark-foreground))] shadow-[0_18px_44px_oklch(0.18_0.018_255_/_0.18)]",
          login ? "h-16 w-16" : compact ? "h-9 w-9" : "h-10 w-10"
        )}
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 64 64"
          role="img"
          className={cn(login ? "h-12 w-12" : "h-8 w-8")}
          fill="none"
        >
          <path
            d="M32 13c4.8 0 8.6 2.9 8.6 6.5 0 2.5-1.6 4.5-4.7 6.1"
            stroke="currentColor"
            strokeWidth="3.6"
            strokeLinecap="round"
          />
          <path
            d="M22.5 28.5 32 20l9.5 8.5 9.4 7.6c1.5 1.2.7 3.6-1.3 3.6H14.4c-2 0-2.8-2.4-1.3-3.6l9.4-7.6Z"
            stroke="currentColor"
            strokeWidth="3.8"
            strokeLinejoin="round"
          />
          <path
            d="M24.2 50.5 32 31.8l7.8 18.7M27.2 43.4h9.6"
            stroke="currentColor"
            strokeWidth="3.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M18 39.7c3.8 2 8.5 3.1 14 3.1s10.2-1.1 14-3.1"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            opacity="0.55"
          />
        </svg>
        <span className="absolute bottom-1 h-px w-8 rounded-full bg-current opacity-35" />
      </div>

      {!compact ? (
        <div className={cn(login && "mt-1")}>
          <div
            className={cn(
              "font-bold leading-tight text-foreground",
              login ? "text-2xl" : "text-sm text-[oklch(0.985_0.006_262)]"
            )}
          >
            NotifyPilot
          </div>
          <div
            className={cn(
              "text-xs leading-5",
              login ? "text-muted-foreground" : "text-[oklch(0.985_0.006_262_/_0.58)]"
            )}
          >
            Aurela Studio
          </div>
        </div>
      ) : null}
    </div>
  );
}
