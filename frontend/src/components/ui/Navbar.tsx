
"use client";

import { useState } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import Image from "next/image";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function closeMobileMenu() {
    setMobileMenuOpen(false);
  }

  return (
    <header className="relative z-10 border-b border-surface-border bg-surface-raised">
      <Container>
        <div className="flex min-h-18 items-center justify-between gap-4">
          {/* Text-only brand wordmark */}
          <Link href="/" aria-label="Njirani home">
            <div className="flex items-center bg-surface-raised border border-surface-border rounded-xl p-2 shadow-sm">
              <Image
                src="/njirani_logo2.jpeg"
                alt="Njirani"
                width={260}
                height={80}
                priority
                className="h-20 w-auto object-contain drop-shadow-[0_0_16px_rgba(0,0,0,0.4)] drop-shadow-[0_0_24px_rgba(124,58,237,0.4)]"
              />
            </div>
          </Link>

          {/* Desktop navigation */}
          <nav
            aria-label="Main navigation"
            className="hidden items-center gap-6 md:flex"
          >
            <Link
              href="/"
              aria-current="page"
              className="rounded-lg px-3 py-2 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50"
            >
              Home
            </Link>
          </nav>

          {/* Theme control and mobile menu button */}
          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle />

            <button
              type="button"
              className="inline-flex size-10 items-center justify-center rounded-xl border border-surface-border text-foreground transition-colors hover:bg-brand-50 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 md:hidden"
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation"
              onClick={() => setMobileMenuOpen((open) => !open)}
            >
              <span aria-hidden="true" className="text-xl leading-none">
                {mobileMenuOpen ? "×" : "☰"}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile navigation */}
        {mobileMenuOpen && (
          <nav
            id="mobile-navigation"
            aria-label="Mobile navigation"
            className="border-t border-surface-border py-3 md:hidden"
          >
            <Link
              href="/"
              aria-current="page"
              onClick={closeMobileMenu}
              className="block rounded-xl px-4 py-3 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50"
            >
              Home
            </Link>
          </nav>
        )}
      </Container>
    </header>
  );
}
