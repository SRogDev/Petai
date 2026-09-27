import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/cn";

/* ---------- ClayCard ---------- */

export function ClayCard({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div className={cn("clay-card p-5", className)} {...rest}>
      {children}
    </div>
  );
}

/* ---------- ClayButton ---------- */

type ClayButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  children: ReactNode;
};

export function ClayButton({
  variant = "primary",
  className,
  children,
  ...rest
}: ClayButtonProps) {
  return (
    <button
      className={cn(
        "clay-btn font-display inline-flex min-h-[44px] items-center justify-center gap-2 px-6 py-3 text-lg font-semibold",
        variant === "primary" && "bg-primary text-on-primary",
        variant === "secondary" && "bg-card text-foreground",
        variant === "ghost" &&
          "border-transparent bg-transparent text-foreground shadow-none",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

/* ---------- Chip ---------- */

export function Chip({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLSpanElement> & { children: ReactNode }) {
  return (
    <span
      className={cn(
        "clay-chip inline-flex items-center gap-1.5 bg-card px-3 py-1.5 text-sm font-bold text-foreground",
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}

/* ---------- SectionTitle ---------- */

export function SectionTitle({
  className,
  children,
}: HTMLAttributes<HTMLHeadingElement> & { children: ReactNode }) {
  return (
    <h2
      className={cn(
        "font-display text-2xl font-semibold text-foreground",
        className,
      )}
    >
      {children}
    </h2>
  );
}
