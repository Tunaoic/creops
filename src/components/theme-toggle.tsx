"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

type Theme = "dark" | "light";

const STORAGE_KEY = "cowork-theme";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  // Hydrate from <html data-theme> (set by inline bootstrap script)
  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme") as Theme;
    setTheme(current === "light" ? "light" : "dark");
    setMounted(true);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {}
  }

  // Avoid hydration mismatch — render placeholder until mounted
  if (!mounted) {
    return (
      <button
        type="button"
        className="p-2 rounded-full text-text-muted opacity-0"
        aria-hidden
      >
        <Moon className="w-4 h-4" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="p-2 rounded-full text-text-muted hover:text-text hover:bg-surface-hover transition-colors"
      title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
    >
      {theme === "dark" ? (
        <Sun className="w-4 h-4" />
      ) : (
        <Moon className="w-4 h-4" />
      )}
    </button>
  );
}
