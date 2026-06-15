import Link from "next/link";
import type { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

const variants = {
  primary:
    "bg-accent text-accent-foreground hover:bg-accent/90 active:translate-y-px disabled:cursor-not-allowed disabled:bg-accent/45",
  secondary:
    "border border-border bg-card text-foreground hover:bg-muted active:translate-y-px disabled:cursor-not-allowed disabled:text-muted-foreground",
  ghost:
    "text-muted-foreground hover:bg-muted hover:text-foreground active:translate-y-px disabled:cursor-not-allowed disabled:text-muted-foreground",
  danger:
    "bg-danger text-[oklch(0.985_0.006_27)] hover:bg-danger/90 active:translate-y-px disabled:cursor-not-allowed disabled:bg-danger/45"
};

const sizes = {
  sm: "h-8 gap-1.5 px-2.5 text-xs",
  md: "h-10 gap-2 px-3.5 text-sm",
  lg: "h-11 gap-2 px-4 text-sm"
};

export type ButtonVariant = keyof typeof variants;
export type ButtonSize = keyof typeof sizes;

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md font-semibold transition duration-150 ease-out",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
}

export function ButtonLink({
  className,
  variant = "primary",
  size = "md",
  children,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}) {
  return (
    <Link
      className={cn(
        "inline-flex items-center justify-center rounded-md font-semibold transition duration-150 ease-out",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </Link>
  );
}
