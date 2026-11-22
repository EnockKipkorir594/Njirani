import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { Card } from "@/components/ui/Card";

import EstateSelectionForm from "./EstateSelectionForm";

export default async function ResidentEstateSelectionPage() {
    const user = await getCurrentUser();

    if (!user) {
        redirect("/resident/login");
    }

    if (user.role !== "RESIDENT") {
        redirect("/");
    }

    // Residents who already have an estate should not revisit selection.
    if (user.estateId) {
        redirect("/resident/dashboard");
    }

    return (
        <main className="min-h-[calc(100vh-5rem)] bg-surface px-4 py-12 md:py-20">
            <div className="mx-auto max-w-2xl space-y-8">
                <section>
                    <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-brand-600">
                        Account setup
                    </p>

                    <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                        Select your estate
                    </h1>

                    <p className="mt-3 text-surface-muted-text">
                        Welcome, {user.name}. Select the estate where
                        you live so we can connect you with relevant
                        service information.
                    </p>
                </section>

                <Card variant="elevated">
                    <div className="space-y-6">
                        <div>
                            <h2 className="font-heading text-xl font-bold text-foreground">
                                Choose your residential estate
                            </h2>

                            <p className="mt-2 text-sm text-surface-muted-text">
                                Select the correct estate from the
                                available list. Your selection will be
                                associated with your account.
                            </p>
                        </div>

                        <EstateSelectionForm />
                    </div>
                </Card>
            </div>
        </main>
    );
}