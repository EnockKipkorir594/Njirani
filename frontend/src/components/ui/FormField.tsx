
import type { InputHTMLAttributes } from "react";

type FormFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "id"
> & {
  id: string;
  label: string;
  helperText?: string;
  error?: string;
  wrapperClassName?: string;
};

export function FormField({
  id,
  label,
  helperText,
  error,
  required = false,
  type = "text",
  className = "",
  wrapperClassName = "",
  ...inputProps
}: FormFieldProps) {
  const helperId = `${id}-helper`;
  const errorId = `${id}-error`;

  const describedBy = [
    helperText ? helperId : undefined,
    error ? errorId : undefined,
    inputProps["aria-describedby"],
  ]
    .filter(Boolean)
    .join(" ") || undefined;

  return (
    <div className={`space-y-2 ${wrapperClassName}`}>
      <label
        htmlFor={id}
        className="block text-sm font-semibold text-foreground"
      >
        {label}
        {required && (
          <span className="ml-1 text-error" aria-hidden="true">
            *
          </span>
        )}
      </label>

      <input
        {...inputProps}
        id={id}
        type={type}
        required={required}
        aria-invalid={error ? true : inputProps["aria-invalid"]}
        aria-describedby={describedBy}
        className={`w-full rounded-xl border bg-surface-raised px-4 py-3 text-foreground placeholder:text-surface-muted-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
          error
            ? "border-error focus-visible:ring-error"
            : "border-surface-border"
        } ${className}`}
      />

      {helperText && (
        <p
          id={helperId}
          className="text-sm text-surface-muted-text"
        >
          {helperText}
        </p>
      )}

      {error && (
        <p
          id={errorId}
          className="text-sm text-error"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}
