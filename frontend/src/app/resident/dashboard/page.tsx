
import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import ResidentBookings from "./ResidentBookings";

export default async function ResidentDashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/resident/login");
  }

  if (user.role !== "RESIDENT") {
    redirect("/");
  }

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-surface px-4 py-12 md:py-16">
      <div className="mx-auto max-w-6xl space-y-8">
        <section>
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-brand-600">
            Resident workspace
          </p>

          <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Welcome back, {user.name}
          </h1>

          <p className="mt-3 text-surface-muted-text">
            Find trusted service providers and keep track of
            your service requests.
          </p>
        </section>

        <section>
          <Card variant="elevated">
            <div className="space-y-3">
              <h2 className="font-heading text-xl font-bold text-foreground">
                Find a service provider
              </h2>

              <p className="text-sm text-surface-muted-text">
                Discover professionals who can help with
                services around your home.
              </p>

              <p className="text-sm font-semibold text-brand-600">
                Provider discovery is coming in the next stage.
              </p>
            </div>
          </Card>
        </section>

        <ResidentBookings />

        <section>
          <Card>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-heading text-lg font-bold text-foreground">
                  Your account
                </h2>

                <p className="mt-1 text-sm text-surface-muted-text">
                  Signed in as {user.email}
                </p>
              </div>

              <Link
                href="/"
                className="text-sm font-semibold text-brand-600 hover:text-brand-700"
              >
                Back to homepage
              </Link>
            </div>
          </Card>
        </section>
      </div>
    </main>
  );
}

