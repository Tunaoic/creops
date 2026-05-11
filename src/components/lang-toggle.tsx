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
        "inline-flex items-center gap-1.5 pl-2 pr-2.5 py-1.5 rounded-full bg-surface border border-border",
        "hover:bg-surface-hover text-text-muted hover:text-text transition-colors",
        "text-[12px] font-medium",
        pending && "opacity-60 cursor-wait"
      )}
      title={title}
      aria-label={title}
    >
      {pending ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Languages className="w-3.5 h-3.5" />
      )}
      <span>{locale === "en" ? "English" : "Tiếng Việt"}</span>
    </button>
  );
}
