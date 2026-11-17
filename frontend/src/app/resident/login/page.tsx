
"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FormField } from "@/components/ui/FormField";

export default function ResidentLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setEmailError("");
    setPasswordError("");
    setServerError("");

    const normalizedEmail = email.trim().toLowerCase();
    let invalid = false;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setEmailError("Enter a valid email address.");
      invalid = true;
    }

    if (!password) {
      setPasswordError("Password is required.");
      invalid = true;
    }

    if (invalid) return;

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/resident-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
          password,
        }),
      });

      const result = await response.json();

      if (!response.ok || result.success !== true) {
        setServerError(
          result.message ??
            "Login failed. Check your credentials and try again.",
        );
        return;
      }

      setPassword("");

      router.replace("/resident/dashboard");
      router.refresh();
    } catch {
      setServerError(
        "Unable to connect to the server. Please try again.",
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
            Welcome back
          </p>

          <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Resident login
          </h1>

          <p className="mt-3 text-surface-muted-text">
            Sign in to discover trusted service providers and
            manage your service requests.
          </p>
        </div>

        <Card variant="elevated">
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
              id="email"
              label="Email address"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              error={emailError}
              required
              disabled={isSubmitting}
            />

            <FormField
              id="password"
              label="Password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              error={passwordError}
              required
              disabled={isSubmitting}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </Card>

        <p className="mt-6 text-center text-sm text-surface-muted-text">
          Looking to offer services?{" "}
          <Link
            href="/provider/login"
            className="font-semibold text-brand-600 underline-offset-4 hover:underline"
          >
            Provider login
          </Link>
        </p>
      </div>
    </main>
  );
}
