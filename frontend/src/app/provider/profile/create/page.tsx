
"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FormField } from "@/components/ui/FormField";

type ServiceCategory = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
};

type ApiResult = {
  success?: boolean;
  message?: string;
  error?: {
    message?: string;
    details?: unknown;
  };
  data?: ServiceCategory[] | unknown;
};

function getErrorMessage(result: ApiResult, fallback: string) {
  return result.error?.message ?? result.message ?? fallback;
}

export default function CreateProviderProfilePage() {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [bio, setBio] = useState("");
  const [serviceRadiusKm, setServiceRadiusKm] = useState("5");

  const [loadingCategories, setLoadingCategories] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pageError, setPageError] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [created, setCreated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      try {
        const response = await fetch("/api/providers/categories", {
          cache: "no-store",
        });

        const result = (await response.json()) as ApiResult;

        if (!response.ok || result.success !== true) {
          throw new Error(
            getErrorMessage(result, "Unable to load service categories."),
          );
        }

        if (!Array.isArray(result.data)) {
          throw new Error("The server returned invalid category data.");
        }

        if (!cancelled) {
          setCategories(result.data as ServiceCategory[]);
        }
      } catch (error) {
        if (!cancelled) {
          setPageError(
            error instanceof Error
              ? error.message
              : "Unable to load service categories.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingCategories(false);
        }
      }
    }

    void loadCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPageError("");
    setFieldError("");

    if (!categoryId) {
      setFieldError("Select the service you provide.");
      return;
    }

    const radius = Number(serviceRadiusKm);

    if (
      !Number.isInteger(radius) ||
      radius < 1 ||
      radius > 25
    ) {
      setFieldError("Service radius must be a whole number from 1 to 25 km.");
      return;
    }

    const trimmedBio = bio.trim();

    if (trimmedBio.length > 0 &&
        (trimmedBio.length < 10 || trimmedBio.length > 250)) {
      setFieldError(
        "Your bio must contain 10–250 characters, or be left empty.",
      );
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/providers/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          categoryId,
          ...(trimmedBio ? { bio: trimmedBio } : {}),
          serviceRadiusKm: radius,
        }),
      });

      const result = (await response.json()) as ApiResult;

      if (!response.ok || result.success !== true) {
        if (response.status === 401) {
          setPageError(
            "Your session has expired. Please sign in again.",
          );
        } else {
          setPageError(
            getErrorMessage(result, "Unable to create your profile."),
          );
        }

        return;
      }

      setCreated(true);
    } catch {
      setPageError(
        "Unable to reach the server. Check your connection and try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-surface py-12 md:py-20">
      <div className="mx-auto w-full max-w-2xl px-4 md:px-8">
        <div className="mb-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-brand-600">
            Provider onboarding
          </p>

          <h1 className="font-heading text-3xl font-bold text-foreground md:text-4xl">
            Create your provider profile
          </h1>

          <p className="mt-3 text-surface-muted-text">
            Tell your community what service you offer and how far
            you are willing to travel.
          </p>
        </div>

        <Card>
          {created ? (
            <div className="space-y-5">
              <div
                role="status"
                className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-900"
              >
                <h2 className="font-heading text-xl font-semibold">
                  Profile created successfully
                </h2>
                <p className="mt-2 text-sm">
                  Your provider profile has been saved.
                </p>
              </div>

              <Link
                href="/"
                className="inline-flex font-semibold text-brand-600 hover:underline"
              >
                Return to home
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {pageError && (
                <div
                  role="alert"
                  className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
                >
                  {pageError}

                  {pageError.toLowerCase().includes("sign in") && (
                    <p className="mt-2">
                      <Link
                        href="/provider/login"
                        className="font-semibold underline"
                      >
                        Go to provider sign in
                      </Link>
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <label
                  htmlFor="categoryId"
                  className="block text-sm font-medium text-foreground"
                >
                  Service category <span aria-hidden="true">*</span>
                </label>

                <select
                  id="categoryId"
                  name="categoryId"
                  required
                  value={categoryId}
                  onChange={(event) => setCategoryId(event.target.value)}
                  disabled={loadingCategories || submitting}
                  className="w-full rounded-lg border border-surface-border bg-surface-raised px-3 py-3 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:opacity-60"
                >
                  <option value="">
                    {loadingCategories
                      ? "Loading categories..."
                      : "Choose a service"}
                  </option>

                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>

                {!loadingCategories && categories.length === 0 && !pageError && (
                  <p className="text-sm text-surface-muted-text">
                    No service categories are available yet.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="bio"
                  className="block text-sm font-medium text-foreground"
                >
                  About your service
                </label>

                <textarea
                  id="bio"
                  name="bio"
                  value={bio}
                  onChange={(event) => setBio(event.target.value)}
                  maxLength={250}
                  rows={5}
                  placeholder="Describe your experience and the services you provide..."
                  disabled={submitting}
                  className="w-full rounded-lg border border-surface-border bg-surface-raised px-3 py-3 text-foreground placeholder:text-surface-muted-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:opacity-60"
                />

                <p className="text-xs text-surface-muted-text">
                  Optional. If provided, enter 10–250 characters.
                  {" "}{bio.length}/250
                </p>
              </div>

              <FormField
                id="serviceRadiusKm"
                name="serviceRadiusKm"
                label="Service radius (km)"
                type="number"
                min={1}
                max={25}
                step={1}
                required
                value={serviceRadiusKm}
                onChange={(event) =>
                  setServiceRadiusKm(event.target.value)
                }
                disabled={submitting}
                helperText="Choose a whole number between 1 and 25 km."
              />

              {fieldError && (
                <p role="alert" className="text-sm text-red-600">
                  {fieldError}
                </p>
              )}

              <Button
                type="submit"
                variant="primary"
                disabled={
                  submitting ||
                  loadingCategories ||
                  categories.length === 0
                }
              >
                {submitting ? "Creating profile..." : "Create profile"}
              </Button>
            </form>
          )}
        </Card>

        <p className="mt-6 text-center text-sm text-surface-muted-text">
          Need to return home?{" "}
          <Link
            href="/"
            className="font-semibold text-brand-600 hover:underline"
          >
            Home
          </Link>
        </p>
      </div>
    </main>
  );
}
