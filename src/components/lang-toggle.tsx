"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Languages, Loader2 } from "lucide-react";
import { setLanguage } from "@/db/actions";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n";

/**
 * Language toggle button — flips between English and Vietnamese.
 * Persists choice via the `creops-lang` cookie (1 year). Server action
 * calls `revalidatePath("/", "layout")` so the whole tree re-renders
 * with the new locale on the next paint.
 */
export function LangToggle({ locale }: { locale: Locale }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next: Locale = locale === "en" ? "vi" : "en";
    startTransition(async () => {
      await setLanguage(next);
      router.refresh();
    });
  }

  // Title text adapts to current locale so it reads naturally before click.
  const title =
    locale === "en"
      ? "Chuyển sang Tiếng Việt"
      : "Switch to English";

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1.5 rounded-md border border-border bg-surface",
        "hover:border-border-strong text-text-muted hover:text-text transition-colors",
        "text-[11px] font-mono uppercase tracking-wider",
        pending && "opacity-60 cursor-wait"
      )}
      title={title}
      aria-label={title}
    >
      {pending ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : (
        <Languages className="w-3 h-3" />
      )}
      <span className="font-semibold">{locale === "en" ? "EN" : "VI"}</span>
    </button>
  );
}
