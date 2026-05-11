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

  // Build breadcrumb labels
  const crumbs: Array<{ label: string; href: string }> = [];
  let acc = "";
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    acc += `/${seg}`;
    let label = seg;
    if (seg === "topics") label = "Topics";
    else if (seg === "settings") label = "Settings";
    else if (seg === "search") label = "Search";
    else if (seg === "board") label = "Board";
    else if (seg === "calendar") label = "Calendar";
    else if (seg === "timeline") label = "Timeline";
    else if (seg === "members") label = "Members";
    else if (seg === "inbox") label = "Inbox";
    else if (seg === "new") label = "New";
    else if (seg === "tasks") label = "Tasks";
    else if (seg === "approve") label = "Approve";
    else if (seg === "channels") label = "Channels";
    else if (topicNames[seg]) label = topicNames[seg];
    crumbs.push({ label, href: acc });
  }

  const homeLabel = locale === "vi" ? "Trang chủ" : "Home";

  return (
    <header className="sticky top-0 z-30 h-13 border-b border-border bg-bg/85 backdrop-blur-md flex items-center gap-3 px-5 py-2">
      {/* Breadcrumbs — sans-serif, gentle */}
      <nav className="flex items-center gap-1.5 flex-1 min-w-0 text-[14px] text-text-muted">
        <Link
          href="/"
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
