
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { Card } from "@/components/ui/Card";

export default async function ProviderDashboardPage() {
  // Validate the user's session on the server.
  const user = await getCurrentUser();

  // Unauthenticated visitors must sign in.
  if (!user) {
    redirect("/provider/login");
  }

  // Only providers may access this dashboard.
  if (user.role !== "PROVIDER") {
    redirect("/");
  }

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-surface px-4 py-12 md:py-16">
      <div className="mx-auto max-w-6xl space-y-8">
        <section>
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-brand-600">
            Provider workspace
          </p>

          <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Welcome back, {user.name}
          </h1>

          <p className="mt-3 text-surface-muted-text">
            Manage your provider account and grow your services on Njirani.
          </p>
        </section>

        <Card variant="elevated">
          <div className="space-y-3">
            <h2 className="font-heading text-xl font-bold text-foreground">
              Your provider dashboard
            </h2>

            <p className="text-sm text-surface-muted-text">
              Your provider account is ready. Dashboard features
              such as booking management, service activity, and
              profile management will be added in their respective
              implementation stages.
            </p>
          </div>
        </Card>
      </div>
    </main>
  );
}
