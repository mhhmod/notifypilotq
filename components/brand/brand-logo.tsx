import { cn } from "@/lib/utils";
import { GrindCtrlMark } from "@/components/brand/grindctrl-mark";

type BrandLogoVariant = "sidebar" | "login" | "compact";

/**
 * GrindCTRL platform lock-up (mark + wordmark). Color is inherited from the
 * caller via currentColor, except the `sidebar` variant which always sits on
 * the dark sidebar surface and pins cream tokens. The `subtitle` carries the
 * connected store name (tenant context) on the sidebar — never the platform.
 */
export function BrandLogo({
  variant = "sidebar",
  title = "GrindCTRL",
  subtitle,
  className
}: {
  variant?: BrandLogoVariant;
  title?: string;
  subtitle?: string;
  className?: string;
}) {
  const compact = variant === "compact";
  const login = variant === "login";
  const sidebar = variant === "sidebar";
  const visibleSubtitle = subtitle?.trim()
    ? subtitle.trim().toLowerCase() === title.trim().toLowerCase()
      ? ""
      : subtitle.trim()
    : "";

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
          "grid shrink-0 place-items-center overflow-hidden",
          login
            ? "h-14 w-14 rounded-lg border border-sidebar-foreground/15 bg-sidebar-foreground/8"
            : compact
              ? "h-8 w-8 rounded-md"
              : "h-9 w-9 rounded-md border border-sidebar-foreground/12 bg-sidebar-foreground/8 text-sidebar-foreground"
        )}
      >
        <GrindCtrlMark size={login ? 30 : compact ? 20 : 22} title="GrindCTRL" />
      </div>

      {!compact ? (
        <div className={cn(login && "mt-2", !login && "min-w-0")}>
          <div
            className={cn(
              "font-display font-extrabold leading-tight tracking-tight",
              login ? "text-2xl" : "truncate text-sm",
              sidebar && "text-sidebar-foreground"
            )}
          >
            {title}
          </div>
          {visibleSubtitle ? (
            <div
              className={cn(
                "text-xs leading-5",
                login ? "opacity-70" : "truncate",
                sidebar && "text-sidebar-foreground/60"
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
