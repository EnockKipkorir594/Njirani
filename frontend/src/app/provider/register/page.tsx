
"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FormField } from "@/components/ui/FormField";

type RegistrationFields = {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
};

type FieldErrors = Partial<Record<keyof RegistrationFields, string>>;

const initialFields: RegistrationFields = {
  name: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
};

function validateFields(fields: RegistrationFields): FieldErrors {
  const errors: FieldErrors = {};

  if (fields.name.trim().length < 2) {
    errors.name = "Name must be at least 2 characters.";
  } else if (fields.name.trim().length > 100) {
    errors.name = "Name must not exceed 100 characters.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim())) {
    errors.email = "Enter a valid email address.";
  }

  const phone = fields.phone.trim();

  if (phone.length < 10 || phone.length > 15) {
    errors.phone = "Phone number must contain 10–15 characters.";
  }

  if (fields.password.length < 8 || fields.password.length > 128) {
    errors.password = "Password must contain 8–128 characters.";
  }

  if (fields.confirmPassword !== fields.password) {
    errors.confirmPassword = "Passwords do not match.";
  }

  return errors;
}

export default function ProviderRegisterPage() {
  const [fields, setFields] = useState(initialFields);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  function updateField(
    field: keyof RegistrationFields,
    value: string,
  ) {
    setFields((current) => ({ ...current, [field]: value }));

    setFieldErrors((current) => {
      const updated = { ...current };
      delete updated[field];
      return updated;
    });

    setServerError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const errors = validateFields(fields);
    setFieldErrors(errors);
    setServerError("");

    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: fields.name.trim(),
          email: fields.email.trim().toLowerCase(),
          phone: fields.phone.trim(),
          password: fields.password,
          role: "PROVIDER",
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setServerError(
          result.error?.message ??
            result.message ??
            "Registration failed. Please try again.",
        );
        return;
      }

      setIsRegistered(true);
      setFields(initialFields);
    } catch {
      setServerError(
        "We couldn't connect to the server. Check your connection and try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-surface px-4 py-12 md:py-20">
      <div className="mx-auto max-w-xl">
        <div className="mb-8 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-brand-600">
            Join Njirani
          </p>

          <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Become a service provider
          </h1>

          <p className="mt-3 text-surface-muted-text">
            Create your account to get started with Njirani.
          </p>
        </div>

        <Card variant="elevated">
          {isRegistered ? (
            <div className="space-y-4 text-center" role="status">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                <span aria-hidden="true" className="text-2xl">
                  ✓
                </span>
              </div>

              <h2 className="font-heading text-xl font-bold">
                Account created successfully
              </h2>

              <p className="text-sm text-surface-muted-text">
                Your provider account has been created. You can now
                proceed to sign in when the provider login page is
                available.
              </p>

              <Button
                className="w-full"
                onClick={() => setIsRegistered(false)}
              >
                Back to registration
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              {serverError && (
                <div
                  role="alert"
                  className="rounded-xl border border-error bg-error/5 p-4 text-sm text-error"
                >
                  {serverError}
                </div>
              )}

              <FormField
                id="name"
                label="Full name"
                autoComplete="name"
                placeholder="Enter your full name"
                value={fields.name}
                onChange={(event) =>
                  updateField("name", event.target.value)
                }
                required
                maxLength={100}
                error={fieldErrors.name}
                disabled={isSubmitting}
              />

              <FormField
                id="email"
                label="Email address"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={fields.email}
                onChange={(event) =>
                  updateField("email", event.target.value)
                }
                required
                error={fieldErrors.email}
                disabled={isSubmitting}
              />

              <FormField
                id="phone"
                label="Phone number"
                type="tel"
                autoComplete="tel"
                placeholder="Enter your phone number"
                value={fields.phone}
                onChange={(event) =>
                  updateField("phone", event.target.value)
                }
                required
                maxLength={15}
                error={fieldErrors.phone}
                disabled={isSubmitting}
              />

              <FormField
                id="password"
                label="Password"
                type="password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={fields.password}
                onChange={(event) =>
                  updateField("password", event.target.value)
                }
                required
                minLength={8}
                maxLength={128}
                error={fieldErrors.password}
                disabled={isSubmitting}
              />

              <FormField
                id="confirmPassword"
                label="Confirm password"
                type="password"
                autoComplete="new-password"
                placeholder="Enter your password again"
                value={fields.confirmPassword}
                onChange={(event) =>
                  updateField("confirmPassword", event.target.value)
                }
                required
                error={fieldErrors.confirmPassword}
                disabled={isSubmitting}
              />

              <p className="text-sm text-surface-muted-text">
                By registering, you are creating a provider account.
                Your provider profile will be completed separately.
              </p>

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating account..." : "Create provider account"}
              </Button>
            </form>
          )}
        </Card>

        <p className="mt-6 text-center text-sm text-surface-muted-text">
        Already have a provider account?{" "}
        <Link
            href="/provider/login"
            className="font-semibold text-brand-600 underline-offset-4 hover:underline"
        >
            Sign in
        </Link>
        </p>
      </div>
    </main>
  );
}
