
"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

const THEME_STORAGE_KEY = "njirani-theme";
const DARK_MODE_QUERY = "(prefers-color-scheme: dark)";

function getEffectiveTheme(): Theme {
  const explicitTheme = document.documentElement.dataset.theme;

  if (explicitTheme === "light" || explicitTheme === "dark") {
    return explicitTheme;
  }

  return window.matchMedia(DARK_MODE_QUERY).matches
    ? "dark"
    : "light";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(getEffectiveTheme());

    const root = document.documentElement;
    const systemPreference = window.matchMedia(DARK_MODE_QUERY);

    function handleSystemPreferenceChange(
      event: MediaQueryListEvent,
    ) {
      // An explicit theme takes precedence over system preference.
      if (
        root.dataset.theme === "light" ||
        root.dataset.theme === "dark"
      ) {
        return;
      }

      setTheme(event.matches ? "dark" : "light");
    }

    systemPreference.addEventListener(
      "change",
      handleSystemPreferenceChange,
    );

    return () => {
      systemPreference.removeEventListener(
        "change",
        handleSystemPreferenceChange,
      );
    };
  }, []);

  function toggleTheme() {
    const root = document.documentElement;
    const currentTheme = getEffectiveTheme();
    const nextTheme: Theme =
      currentTheme === "dark" ? "light" : "dark";

    root.setAttribute("data-theme", nextTheme);

    try {
      window.localStorage.setItem(
        THEME_STORAGE_KEY,
        nextTheme,
      );
    } catch {
      // The theme still changes for this session if storage is unavailable.
    }

    setTheme(nextTheme);
  }

  const accessibleLabel =
    theme === null
      ? "Toggle light and dark theme"
      : `Switch to ${theme === "dark" ? "light" : "dark"} mode`;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={accessibleLabel}
      aria-pressed={theme === null ? undefined : theme === "dark"}
      className="inline-flex items-center gap-2 rounded-xl border border-surface-border bg-surface-raised px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-brand-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
    >
      <span aria-hidden="true">
        {theme === null ? "◐" : theme === "dark" ? "☀" : "☾"}
      </span>
      <span>Theme</span>
    </button>
  );
}
