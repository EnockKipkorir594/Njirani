import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "accent";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const baseStyles =
  "inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-500 text-white hover:bg-brand-600",

  secondary:
    "border border-stone-300 text-stone-700 hover:bg-stone-50",

  ghost:
    "text-stone-600 hover:bg-brand-50 hover:text-brand-600",

  accent:
    "bg-accent-500 text-white hover:bg-accent-600",
};

export function Button({
  variant = "primary",
  type = "button",
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}