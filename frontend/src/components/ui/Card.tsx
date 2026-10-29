import type { HTMLAttributes } from "react";

type CardVariant = "default" | "elevated";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: CardVariant;
  hoverable?: boolean;
};

const variantStyles: Record<CardVariant, string> = {
  default:
    "border border-surface-border bg-surface-raised",

  elevated:
    "border border-surface-border bg-surface-raised shadow-sm",
};

export function Card({
  variant = "default",
  hoverable = false,
  className = "",
  children,
  ...props
}: CardProps) {
  const hoverStyles = hoverable
    ? "transition-all duration-300 hover:border-brand-200 hover:shadow-lg"
    : "";

  return (
    <div
      className={`rounded-2xl p-6 text-foreground md:p-8 ${variantStyles[variant]} ${hoverStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}