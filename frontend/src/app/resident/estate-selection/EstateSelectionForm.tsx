"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

interface Estate {
    id: string;
    name: string;
}

interface EstatesResponse {
    success: boolean;
    data?: Estate[];
    meta?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    message?: string;
}

interface ApiErrorResponse {
    success?: boolean;
    message?: string;
    error?: {
        message?: string;
    };
}

const PAGE_SIZE = 50;

export default function EstateSelectionForm() {
    const router = useRouter();

    const [estates, setEstates] = useState<Estate[]>([]);
    const [selectedEstateId, setSelectedEstateId] = useState("");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [loadError, setLoadError] = useState("");
    const [submitError, setSubmitError] = useState("");

    useEffect(() => {
        const controller = new AbortController();

        async function loadEstates() {
            setIsLoading(true);
            setLoadError("");

            try {
                const params = new URLSearchParams({
                    page: String(page),
                    limit: String(PAGE_SIZE),
                });

                if (search.trim()) {
                    params.set("search", search.trim());
                }

                const response = await fetch(
                    `/api/estates?${params.toString()}`,
                    {
                        method: "GET",
                        cache: "no-store",
                        signal: controller.signal,
                    }
                );

                const result =
                    (await response.json()) as EstatesResponse;

                if (!response.ok || result.success !== true) {
                    throw new Error(
                        result.message ?? "Unable to load estates."
                    );
                }

                setEstates(result.data ?? []);
                setTotalPages(
                    Math.max(1, result.meta?.totalPages ?? 1)
                );

                // Clear a previous selection if it is no longer available.
                setSelectedEstateId((current) =>
                    result.data?.some((estate) => estate.id === current)
                        ? current
                        : ""
                );
            } catch (error) {
                if (
                    error instanceof Error &&
                    error.name === "AbortError"
                ) {
                    return;
                }

                setLoadError(
                    error instanceof Error
                        ? error.message
                        : "Unable to load estates. Please try again."
                );
            } finally {
                if (!controller.signal.aborted) {
                    setIsLoading(false);
                }
            }
        }

        loadEstates();

        return () => controller.abort();
    }, [page, search]);

    const submitAssignment = useCallback(async () => {
        return fetch("/api/estates/me", {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                estateId: selectedEstateId,
            }),
        });
    }, [selectedEstateId]);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setSubmitError("");

        if (!selectedEstateId) {
            setSubmitError("Please select your estate.");
            return;
        }

        setIsSubmitting(true);

        try {
            let response = await submitAssignment();

            // Recover once if the access token has expired.
            if (response.status === 401) {
                const refreshResponse = await fetch(
                    "/api/auth/refresh",
                    {
                        method: "POST",
                    }
                );

                if (!refreshResponse.ok) {
                    router.replace("/resident/login");
                    return;
                }

                response = await submitAssignment();
            }

            const result =
                (await response.json()) as ApiErrorResponse;

            if (!response.ok || result.success !== true) {
                setSubmitError(
                    result.error?.message ??
                        result.message ??
                        "Unable to assign your estate. Please try again."
                );
                return;
            }

            router.replace("/resident/dashboard");
        } catch {
            setSubmitError(
                "Unable to connect to the server. Please try again."
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <label
                    htmlFor="estate-search"
                    className="mb-2 block text-sm font-semibold text-foreground"
                >
                    Search for your estate
                </label>

                <input
                    id="estate-search"
                    type="search"
                    value={search}
                    onChange={(event) => {
                        setSearch(event.target.value);
                        setPage(1);
                    }}
                    placeholder="Enter your estate name..."
                    disabled={isLoading || isSubmitting}
                    className="w-full rounded-xl border border-surface-border bg-surface-raised px-4 py-3 text-foreground outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 disabled:opacity-60"
                />
            </div>

            {loadError && (
                <div
                    role="alert"
                    className="rounded-xl border border-error bg-error/5 p-4 text-sm text-error"
                >
                    {loadError}
                </div>
            )}

            {isLoading ? (
                <p
                    className="text-sm text-surface-muted-text"
                    role="status"
                >
                    Loading available estates...
                </p>
            ) : estates.length === 0 ? (
                <div className="rounded-xl border border-border p-6 text-center">
                    <p className="font-semibold text-foreground">
                        No estates found
                    </p>

                    <p className="mt-2 text-sm text-surface-muted-text">
                        Try another search term or contact support if your
                        estate is not listed.
                    </p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label
                            htmlFor="estate"
                            className="mb-2 block text-sm font-semibold text-foreground"
                        >
                            Select your estate
                        </label>

                        <select
                            id="estate"
                            value={selectedEstateId}
                            onChange={(event) =>
                                setSelectedEstateId(event.target.value)
                            }
                            disabled={isSubmitting}
                            required
                            className="w-full rounded-xl border border-surface-border bg-surface-raised px-4 py-3 text-foreground outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 disabled:opacity-60"
                        >
                            <option value="" disabled className="bg-surface-raised text-foreground">
                                Choose an estate
                            </option>
                            {estates.map((estate) => (
                                <option
                                    key={estate.id}
                                    value={estate.id}
                                    className="bg-surface-raised text-foreground"
                                >
                                    {estate.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {submitError && (
                        <div
                            role="alert"
                            className="rounded-xl border border-error bg-error/5 p-4 text-sm text-error"
                        >
                            {submitError}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={!selectedEstateId || isSubmitting}
                        className="w-full rounded-xl bg-brand-600 px-5 py-3 font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isSubmitting
                            ? "Saving your estate..."
                            : "Confirm estate"}
                    </button>
                </form>
            )}

            {!isLoading && totalPages > 1 && (
                <div className="flex items-center justify-between gap-4">
                    <button
                        type="button"
                        onClick={() =>
                            setPage((current) => Math.max(1, current - 1))
                        }
                        disabled={page === 1 || isSubmitting}
                        className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground disabled:opacity-40"
                    >
                        Previous
                    </button>

                    <p className="text-sm text-surface-muted-text">
                        Page {page} of {totalPages}
                    </p>

                    <button
                        type="button"
                        onClick={() =>
                            setPage((current) =>
                                Math.min(totalPages, current + 1)
                            )
                        }
                        disabled={page >= totalPages || isSubmitting}
                        className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground disabled:opacity-40"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}