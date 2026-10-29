
import type { HTMLAttributes } from "react";

type BadgeVariant =
  | "success"
  | "warning"
  | "error"
  | "info"
  | "neutral";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

const variantStyles: Record<BadgeVariant, string> = {
  success: "border-success/30 bg-success/10 text-success",
  warning: "border-warning/30 bg-warning/10 text-warning",
  error: "border-error/30 bg-error/10 text-error",
  info: "border-info/30 bg-info/10 text-info",
  neutral:
    "border-surface-border bg-surface-raised text-surface-muted-text",
};

export function Badge({
  variant = "neutral",
  className = "",
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
