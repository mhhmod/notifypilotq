import { cn } from "@/lib/utils";

type BrandLogoVariant = "sidebar" | "login" | "compact";

export function BrandLogo({
  variant = "sidebar",
  title = "SN2 Studios",
  subtitle = "Web push campaigns",
  className
}: {
  variant?: BrandLogoVariant;
  title?: string;
  subtitle?: string;
  className?: string;
}) {
  const compact = variant === "compact";
  const login = variant === "login";
  const visibleSubtitle =
    subtitle.trim().toLowerCase() === title.trim().toLowerCase() ? "" : subtitle.trim();

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
          "grid shrink-0 place-items-center rounded-md border font-display font-extrabold tracking-tight",
          login
            ? "h-14 w-14 border-border bg-card text-base text-foreground"
            : compact
              ? "h-8 w-8 border-sidebar-foreground/12 bg-sidebar-foreground/8 text-xs text-sidebar-foreground"
              : "h-9 w-9 border-sidebar-foreground/12 bg-sidebar-foreground/8 text-xs text-sidebar-foreground"
        )}
        aria-hidden="true"
      >
        SN2
      </div>

      {!compact ? (
        <div className={cn(login && "mt-2")}>
          <div
            className={cn(
              "font-display font-extrabold leading-tight tracking-tight",
              login ? "text-2xl text-foreground" : "text-sm text-sidebar-foreground"
            )}
          >
            {title}
          </div>
          {visibleSubtitle ? (
            <div
              className={cn(
                "text-xs leading-5",
                login ? "text-muted-foreground" : "text-sidebar-foreground/60"
              )}
            >
              {visibleSubtitle}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
