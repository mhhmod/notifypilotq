import { cn } from "@/lib/utils";
import { GrindCtrlMark } from "@/components/brand/grindctrl-mark";

type BrandLogoVariant = "sidebar" | "login" | "compact";

export function BrandLogo({
  variant = "sidebar",
  subtitle = "Web push campaigns",
  className
}: {
  variant?: BrandLogoVariant;
  subtitle?: string;
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
      <GrindCtrlMark
        className={cn(
          "shrink-0",
          login
            ? "h-14 w-14 text-foreground"
            : compact
              ? "h-8 w-8 text-sidebar-foreground"
              : "h-9 w-9 text-sidebar-foreground"
        )}
      />

      {!compact ? (
        <div className={cn(login && "mt-2")}>
          <div
            className={cn(
              "font-display font-extrabold leading-tight tracking-tight",
              login ? "text-2xl text-foreground" : "text-sm text-sidebar-foreground"
            )}
          >
            GrindCTRL
          </div>
          <div
            className={cn(
              "text-xs leading-5",
              login ? "text-muted-foreground" : "text-sidebar-foreground/60"
            )}
          >
            {subtitle}
          </div>
        </div>
      ) : null}
    </div>
  );
}
