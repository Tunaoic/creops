"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Search, HelpCircle } from "lucide-react";
import { NotificationsBell } from "@/components/notifications-bell";
import { ThemeToggle } from "@/components/theme-toggle";
import { LangToggle } from "@/components/lang-toggle";
import { UserSwitcher } from "@/components/user-switcher";
import type { NotificationEntry } from "@/db/queries";
import type { User } from "@/types";
import type { Locale } from "@/lib/i18n";

export function TopBar({
  topicNames,
  notifications,
  unreadCount,
  members,
  currentUserId,
  locale,
  showImpersonator = true,
}: {
  topicNames: Record<string, string>;
  notifications: NotificationEntry[];
  unreadCount: number;
  members: User[];
  currentUserId: string;
  locale: Locale;
  /** False in production (Clerk auth on) — hides the dev impersonation switcher. */
  showImpersonator?: boolean;
}) {
  const searchLabel = locale === "vi" ? "Tìm kiếm" : "Search";
  const helpLabel = locale === "vi" ? "Trợ giúp" : "Help";
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  // Build breadcrumb labels.
  // Lookup order:
  //   1. STATIC_LABELS — well-known segments (sentence-cased nice names)
  //   2. topicNames map — for dynamic /topics/[id] segments
  //   3. titleCase fallback — covers any future segment without code edit
  // The fallback keeps URLs like /connections rendering as "Connections"
  // even if someone forgets to add a static label.
  const crumbs: Array<{ label: string; href: string }> = [];
  let acc = "";
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    acc += `/${seg}`;
    const label =
      STATIC_LABELS[seg] ?? topicNames[seg] ?? titleCase(seg);
    crumbs.push({ label, href: acc });
  }

  const homeLabel = locale === "vi" ? "Trang chủ" : "Home";

  return (
    <header className="sticky top-0 z-30 h-13 border-b border-border bg-bg/85 backdrop-blur-md flex items-center gap-3 px-5 py-2">
      {/* Breadcrumbs — sans-serif, gentle */}
      <nav className="flex items-center gap-1.5 flex-1 min-w-0 text-[14px] text-text-muted">
        <Link
          href="/dashboard"
          className="hover:text-text transition-colors"
        >
          {homeLabel}
        </Link>
        {crumbs.map((c, i) => (
          <span key={c.href} className="flex items-center gap-1.5">
            <ChevronRight className="w-3.5 h-3.5 text-text-subtle" strokeWidth={2} />
            {i === crumbs.length - 1 ? (
              <span className="text-text font-medium truncate max-w-[260px]">
                {c.label}
              </span>
            ) : (
              <Link
                href={c.href}
                className="hover:text-text transition-colors truncate max-w-[180px]"
              >
                {c.label}
              </Link>
            )}
          </span>
        ))}
      </nav>

      {/* Right cluster */}
      <div className="flex items-center gap-2 shrink-0">
        {showImpersonator && (
          <UserSwitcher members={members} currentUserId={currentUserId} />
        )}
        <button
          type="button"
          onClick={() => {
            const e = new KeyboardEvent("keydown", { key: "k", metaKey: true });
            window.dispatchEvent(e);
          }}
          className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-full bg-surface hover:bg-surface-hover transition-colors text-text-muted hover:text-text border border-border"
        >
          <Search className="w-3.5 h-3.5" strokeWidth={2} />
          <span className="text-[13px]">{searchLabel}</span>
          <kbd>⌘K</kbd>
        </button>
        <NotificationsBell
          notifications={notifications}
          unreadCount={unreadCount}
        />
        <LangToggle locale={locale} />
        <ThemeToggle />
        <button
          type="button"
          className="p-2 rounded-full text-text-muted hover:text-text hover:bg-surface-hover transition-colors"
          title={helpLabel}
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}

/**
 * Friendly labels for URL segments. Keep this list small — anything
 * missing falls through to titleCase() which handles most cases.
 * Only override when the auto-cased label would be wrong or ugly
 * (e.g. acronyms, kept-lowercase product names).
 *
 * Add to i18n if a label needs translation. Right now breadcrumbs are
 * English-only — the user's stated audience reads English nav fine
 * in VI mode too. Revisit when we go multi-language at the segment
 * level.
 */
const STATIC_LABELS: Record<string, string> = {
  // Top-level nav (sentence case)
  dashboard: "Dashboard",
  inbox: "Inbox",
  topics: "Topics",
  board: "Board",
  calendar: "Calendar",
  performance: "Performance",
  connections: "Connections",
  search: "Search",
  settings: "Settings",
  welcome: "Welcome",
  onboarding: "Onboarding",
  // Nested
  members: "Members",
  workspaces: "Workspaces",
  channels: "Channels",
  tasks: "Tasks",
  approve: "Approve",
  new: "New",
  join: "Join",
};

function titleCase(seg: string): string {
  if (!seg) return seg;
  // Strip URL-encoded chars; replace hyphens with spaces; cap first letter
  const cleaned = decodeURIComponent(seg).replace(/-/g, " ");
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}
