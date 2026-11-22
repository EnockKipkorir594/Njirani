
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

type Booking = {
  id: string;
  status: BookingStatus;
  scheduledAt: string;
  description: string;
  priceQuote: string | number | null;
  provider: {
    id: string;
    name: string;
  };
  category: {
    id: string;
    name: string;
    slug: string;
  };
  estate: {
    id: string;
    name: string;
  };
};

type BookingResponse = {
  success: boolean;
  data?: Booking[];
  message?: string;
  error?: {
    message?: string;
  };
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type StatusFilter = "ALL" | BookingStatus;

const statusLabels: Record<BookingStatus, string> = {
  PENDING: "Awaiting provider",
  CONFIRMED: "Confirmed",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const statusStyles: Record<BookingStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  IN_PROGRESS: "bg-purple-100 text-purple-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

function formatScheduledAt(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function BookingsSkeleton() {
  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-heading text-2xl font-bold text-foreground">
            Your bookings
          </h2>
          <p className="mt-1 text-sm text-surface-muted-text">
            Track your service requests and their progress.
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="booking-status-filter"
            className="text-sm font-medium text-foreground"
          >
            Filter by status
          </label>

          <select
            id="booking-status-filter"
            disabled
            className="rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-foreground"
          >
            <option value="ALL">All bookings</option>
            <option value="PENDING">Awaiting provider</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="IN_PROGRESS">In progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} variant="elevated">
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="h-5 w-48 bg-surface-border/50 rounded animate-pulse" />
                  <div className="mt-2 h-4 w-32 bg-surface-border/50 rounded animate-pulse" />
                </div>

                <div className="h-6 w-24 bg-surface-border/50 rounded-full animate-pulse" />
              </div>

              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <div className="h-3 w-24 bg-surface-border/50 rounded animate-pulse" />
                  <div className="mt-1 h-4 w-32 bg-surface-border/50 rounded animate-pulse" />
                </div>

                <div>
                  <div className="h-3 w-20 bg-surface-border/50 rounded animate-pulse" />
                  <div className="mt-1 h-4 w-28 bg-surface-border/50 rounded animate-pulse" />
                </div>
              </div>

              <div>
                <div className="h-3 w-32 bg-surface-border/50 rounded animate-pulse" />
                <div className="mt-1 space-y-2">
                  <div className="h-4 w-full bg-surface-border/50 rounded animate-pulse" />
                  <div className="h-4 w-3/4 bg-surface-border/50 rounded animate-pulse" />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-surface-muted-text">
          Loading bookings...
        </p>

        <div className="flex gap-2">
          <Button type="button" variant="secondary" disabled>
            Previous
          </Button>

          <Button type="button" variant="secondary" disabled>
            Next
          </Button>
        </div>
      </div>
    </section>
  );
}

export default function ResidentBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBookings, setTotalBookings] = useState(0);
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("ALL");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSessionExpired(false);

    const query = new URLSearchParams({
      page: String(page),
      limit: "10",
    });

    if (statusFilter !== "ALL") {
      query.set("status", statusFilter);
    }

    try {
      let response = await fetch(`/api/bookings?${query.toString()}`, {
        method: "GET",
        cache: "no-store",
      });

      // An expired access token gets one refresh attempt.
      if (response.status === 401) {
        const refreshResponse = await fetch("/api/auth/refresh", {
          method: "POST",
          cache: "no-store",
        });

        if (!refreshResponse.ok) {
          setSessionExpired(true);
          setError("Your session has expired. Please sign in again.");
          return;
        }

        // The refresh route has rotated the HTTP-only cookies.
        response = await fetch(`/api/bookings?${query.toString()}`, {
          method: "GET",
          cache: "no-store",
        });
      }

      const result = (await response.json()) as BookingResponse;

      if (response.status === 401) {
        setSessionExpired(true);
        setError("Your session has expired. Please sign in again.");
        return;
      }

      if (!response.ok || result.success !== true) {
        setError(
          result.error?.message ??
            result.message ??
            "Unable to load your bookings."
        );
        return;
      }

      if (!Array.isArray(result.data)) {
        setError("The booking service returned unexpected data.");
        return;
      }

      setBookings(result.data);
      setTotalBookings(result.meta?.total ?? result.data.length);
      setTotalPages(Math.max(1, result.meta?.totalPages ?? 1));
    } catch {
      setError("A network error occurred while loading your bookings.");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    void loadBookings();
  }, [loadBookings]);

  function handleStatusChange(value: StatusFilter) {
    setStatusFilter(value);
    setPage(1);
  }

  if (loading) {
    return <BookingsSkeleton />;
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-heading text-2xl font-bold text-foreground">
            Your bookings
          </h2>
          <p className="mt-1 text-sm text-surface-muted-text">
            Track your service requests and their progress.
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="booking-status-filter"
            className="text-sm font-medium text-foreground"
          >
            Filter by status
          </label>

          <select
            id="booking-status-filter"
            value={statusFilter}
            onChange={(event) =>
              handleStatusChange(event.target.value as StatusFilter)
            }
            className="rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-foreground"
          >
            <option value="ALL">All bookings</option>
            <option value="PENDING">Awaiting provider</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="IN_PROGRESS">In progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {error && (
        <Card>
          <div className="space-y-4">
            <p className="text-sm text-red-600">{error}</p>

            {sessionExpired ? (
              <Link
                href="/resident/login"
                className="inline-flex rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
              >
                Sign in
              </Link>
            ) : (
              <Button type="button" onClick={() => void loadBookings()}>
                Try again
              </Button>
            )}
          </div>
        </Card>
      )}

      {!error && bookings.length === 0 && (
        <Card>
          <div className="space-y-2">
            <h3 className="font-heading text-lg font-bold text-foreground">
              No bookings found
            </h3>
            <p className="text-sm text-surface-muted-text">
              {statusFilter === "ALL"
                ? "You have not made any service requests yet."
                : "You do not have bookings with this status."}
            </p>
          </div>
        </Card>
      )}

      {!error && bookings.length > 0 && (
        <>
          <div className="space-y-4">
            {bookings.map((booking) => (
              <Card key={booking.id} variant="elevated">
                <div className="space-y-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="font-heading text-lg font-bold text-foreground">
                        {booking.category.name}
                      </h3>
                      <p className="mt-1 text-sm text-surface-muted-text">
                        Provider: {booking.provider.name}
                      </p>
                    </div>

                    <span
                      className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                        statusStyles[booking.status]
                      }`}
                    >
                      {statusLabels[booking.status]}
                    </span>
                  </div>

                  <div className="grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <p className="text-surface-muted-text">Scheduled for</p>
                      <p className="mt-1 font-medium text-foreground">
                        {formatScheduledAt(booking.scheduledAt)}
                      </p>
                    </div>

                    <div>
                      <p className="text-surface-muted-text">Estate</p>
                      <p className="mt-1 font-medium text-foreground">
                        {booking.estate.name}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-surface-muted-text">
                      Service description
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
                      {booking.description}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-surface-muted-text">
              {totalBookings} booking{totalBookings === 1 ? "" : "s"} found
              {" · "}Page {page} of {totalPages}
            </p>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={page <= 1 || loading}
                onClick={() => setPage((current) => current - 1)}
              >
                Previous
              </Button>

              <Button
                type="button"
                variant="secondary"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
