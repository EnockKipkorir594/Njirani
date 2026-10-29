

import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card } from "@/components/ui/Card";
import Link from "next/link";

const services = [
  {
    name: "Plumbing",
    description: "For the leaks and little fixes.",
    icon: "🔧",
  },
  {
    name: "Electrical",
    description: "For a home that works as it should.",
    icon: "💡",
  },
  {
    name: "Cleaning",
    description: "A little help making home feel fresh.",
    icon: "🧹",
  },
  {
    name: "Painting",
    description: "Give your favourite spaces new life.",
    icon: "🖌️",
  },
];


const howItWorksSteps = [
  {
    number: "01",
    title: "Tell us what you need",
    description:
      "Describe the household task, repair, or service you need help with.",
    icon: "📝",
  },
  {
    number: "02",
    title: "Explore your options",
    description:
      "Discover local providers who can respond to your request and compare their offers.",
    icon: "🤝",
  },
  {
    number: "03",
    title: "Choose with confidence",
    description:
      "Select the provider who best fits your needs and agree on the next steps.",
    icon: "🏡",
  },
];


export default function Home() {
  return (
    <main className="flex-1">

      {/* Hero */}
      <section className="relative isolate overflow-hidden py-16 md:py-24">
        <Container>
          <div className="grid items-center gap-12 md:grid-cols-2 md:gap-16">
            {/* Hero copy */}
            <div className="relative z-10 space-y-6">
              <p className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-surface-raised px-4 py-2 text-sm font-semibold text-foreground">
                <span aria-hidden="true">🏡</span>
                Good help, closer to home
              </p>

              <h1 className="max-w-xl font-heading text-4xl font-extrabold leading-[1.12] tracking-tight text-foreground sm:text-5xl md:text-6xl">
                Your home deserves{" "}
                <span className="text-brand-600">
                  good people.
                </span>
              </h1>

              <p className="max-w-lg text-lg leading-relaxed text-surface-muted-text">
                From a dripping tap to a fresh coat of paint,
                find local service providers who can help make
                everyday life a little easier.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-1">
                <a
                  href="#services"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                >
                  Explore services
                  <span aria-hidden="true">→</span>
                </a>
              </div>

              <p className="text-sm leading-relaxed text-surface-muted-text">
                Neighbourhood connections. A little more peace of mind.
              </p>
            </div>


            {/* Hero visual */}
            <div className="relative mx-auto w-full max-w-md">
              {/* Soft decorative shapes */}
              <div
                aria-hidden="true"
                className="absolute -right-5 -top-5 size-28 rounded-full bg-accent-400/20 blur-2xl"
              />
              <div
                aria-hidden="true"
                className="absolute -bottom-5 -left-5 size-32 rounded-full bg-brand-400/15 blur-2xl"
              />

              <div className="relative overflow-hidden rounded-[2rem] border border-surface-border bg-[#f0faf4] p-5 shadow-sm sm:p-7">
                {/* Decorative background details */}
                <div
                  aria-hidden="true"
                  className="absolute -right-12 -top-12 size-48 rounded-full border border-brand-200/70"
                />
                <div
                  aria-hidden="true"
                  className="absolute -right-6 -top-6 size-36 rounded-full border border-brand-200/70"
                />

                {/* Panel heading */}
                <div className="relative z-10 flex items-start justify-between gap-4">
                  <div className="max-w-xs">
                    <p className="text-sm font-medium text-brand-700">
                      The neighbourhood advantage
                    </p>
                    <h2 className="mt-2 font-heading text-2xl font-bold leading-tight text-stone-900 sm:text-3xl">
                      A little closer.
                      <br />
                      A little easier.
                    </h2>
                  </div>

                  <span
                    aria-hidden="true"
                    className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm"
                  >
                    🏡
                  </span>
                </div>

                {/* Central illustration */}
                <div className="relative my-7 flex min-h-52 items-center justify-center">
                  <div
                    aria-hidden="true"
                    className="absolute size-48 rounded-full bg-brand-200/60 sm:size-56"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute size-36 rounded-full border border-brand-300/70 sm:size-44"
                  />

                  {/* Home illustration built from simple shapes */}
                  <div
                    aria-hidden="true"
                    className="relative flex size-32 items-center justify-center rounded-[2rem] border border-brand-200 bg-white shadow-sm sm:size-36"
                  >
                    <svg
                      viewBox="0 0 120 120"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="size-24 sm:size-28"
                    >
                      <path
                        d="M17 55L60 19L103 55"
                        stroke="#1f8a4a"
                        strokeWidth="7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M28 51V99H92V51"
                        fill="#dcf5e7"
                        stroke="#1f8a4a"
                        strokeWidth="5"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M49 99V70C49 64 54 59 60 59C66 59 71 64 71 70V99"
                        fill="#fbbf24"
                        stroke="#1f8a4a"
                        strokeWidth="4"
                      />
                      <rect
                        x="35"
                        y="62"
                        width="10"
                        height="12"
                        rx="2"
                        fill="#88d9ab"
                      />
                      <rect
                        x="75"
                        y="62"
                        width="10"
                        height="12"
                        rx="2"
                        fill="#88d9ab"
                      />
                    </svg>
                  </div>

                  {/* Floating service markers */}
                  <div className="absolute left-0 top-5 flex size-12 items-center justify-center rounded-2xl border border-brand-100 bg-white text-2xl shadow-sm sm:left-2">
                    <span aria-hidden="true">🔧</span>
                  </div>

                  <div className="absolute right-0 top-8 flex size-12 items-center justify-center rounded-2xl border border-brand-100 bg-white text-2xl shadow-sm sm:right-2">
                    <span aria-hidden="true">💡</span>
                  </div>

                  <div className="absolute bottom-1 left-6 flex size-12 items-center justify-center rounded-2xl border border-brand-100 bg-white text-2xl shadow-sm sm:left-8">
                    <span aria-hidden="true">🧹</span>
                  </div>

                  <div className="absolute bottom-0 right-5 flex size-12 items-center justify-center rounded-2xl border border-brand-100 bg-white text-2xl shadow-sm sm:right-7">
                    <span aria-hidden="true">🪴</span>
                  </div>
                </div>

                {/* Closing message */}
                <div className="relative z-10 rounded-2xl border border-brand-200/70 bg-white/80 p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <span
                      aria-hidden="true"
                      className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-xl"
                    >
                      💚
                    </span>
                    <div>
                      <p className="font-heading font-semibold text-stone-900">
                        Home feels better with a little help.
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-stone-600">
                        Discover the everyday services that help keep your home running smoothly.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </Container>
      </section>



      {/* How Njirani works */}
      <section
        id="how-it-works"
        className="border-t border-surface-border bg-surface-raised py-16 md:py-24"
      >
        <Container>
          <SectionHeader
            badge="Simple by design"
            title="Getting help should feel easy."
            subtitle="Njirani is designed to make finding and choosing local service providers a more straightforward experience."
            centered
            className="mx-auto mb-12 max-w-2xl"
          />

          <div className="grid gap-5 md:grid-cols-3 md:gap-6">
            {howItWorksSteps.map((step) => (
              <Card
                key={step.number}
                className="relative h-full"
              >
                <div className="flex items-start justify-between gap-4">
                  <span
                    aria-hidden="true"
                    className="flex size-14 items-center justify-center rounded-2xl bg-brand-50 text-2xl"
                  >
                    {step.icon}
                  </span>

                  <span
                    aria-hidden="true"
                    className="font-mono text-sm font-semibold tracking-wider text-brand-600"
                  >
                    {step.number}
                  </span>
                </div>

                <h3 className="mt-7 font-heading text-xl font-semibold text-foreground">
                  {step.title}
                </h3>

                <p className="mt-3 text-base leading-relaxed text-surface-muted-text">
                  {step.description}
                </p>
              </Card>
            ))}
          </div>

          <p className="mx-auto mt-8 max-w-2xl text-center text-sm leading-relaxed text-surface-muted-text">
            A more connected neighbourhood starts with making it easier
            to find the right help.
          </p>
        </Container>
      </section>



      {/* Service categories */}
      <section
        id="services"
        className="border-t border-surface-border bg-background py-16 md:py-24"
      >
        <Container>
          <SectionHeader
            badge="A hand with the everyday"
            title="What can we help you with?"
            subtitle="From small household fixes to a little extra help, discover the services that make everyday life easier."
            centered={false}
            className="mb-10 max-w-2xl"
          />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((service, index) => (
              <Card
                key={service.name}
                className="group flex h-full flex-col border border-surface-border transition-colors duration-200 hover:border-brand-300"
              >
                <div className="flex items-center justify-between gap-3">
                  <span
                    aria-hidden="true"
                    className="flex size-14 items-center justify-center rounded-2xl border border-surface-border bg-surface-raised text-3xl transition-colors duration-200 group-hover:border-brand-200"
                  >
                    {service.icon}
                  </span>

                  <span className="font-mono text-xs font-medium tracking-wider text-surface-muted-text">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>

                <div className="mt-6 flex flex-1 flex-col">
                  <h3 className="font-heading text-xl font-semibold text-foreground">
                    {service.name}
                  </h3>

                  <p className="mt-2 flex-1 text-sm leading-relaxed text-surface-muted-text">
                    {service.description}
                  </p>

                  <div
                    aria-hidden="true"
                    className="mt-5 h-1 w-10 rounded-full bg-brand-200 transition-all duration-200 group-hover:w-16 group-hover:bg-brand-500"
                  />
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-surface-border bg-surface-raised p-5 sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-6">
            <div className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-xl"
              >
                🌱
              </span>

              <div>
                <h3 className="font-heading font-semibold text-foreground">
                  More help, closer to home
                </h3>
                <p className="mt-1 max-w-xl text-sm leading-relaxed text-surface-muted-text">
                  These are starting categories for Njirani&apos;s neighbourhood
                  services marketplace. More categories can be introduced as
                  the platform develops.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>


      {/* Provider-facing CTA */}
      <section
        id="providers"
        className="border-t border-surface-border bg-surface-raised py-16 md:py-24"
      >
        <Container>
          <div className="overflow-hidden rounded-2xl border border-surface-border bg-background p-6 md:p-10">
            <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
              <div className="max-w-2xl">
                <span className="inline-flex items-center rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                  For local service providers
                </span>

                <h2 className="mt-5 font-heading text-3xl font-bold text-foreground md:text-4xl">
                  Good at what you do? Let your neighbourhood know.
                </h2>

                <p className="mt-4 text-base leading-relaxed text-surface-muted-text md:text-lg">
                  Connect with nearby residents looking for help with everyday home
                  services. Njirani is building a simpler way for local providers to
                  get discovered by the communities around them.
                </p>
              </div>

              <div className="flex flex-col items-start gap-3 md:items-end">
                <Link
                  href="/provider/register"
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 font-semibold text-white transition-colors duration-200 hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                >
                  Become a Njirani provider
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>

    </main>
  );
}
