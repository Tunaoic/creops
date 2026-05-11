"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Search, HelpCircle } from "lucide-react";
import { NotificationsBell } from "@/components/notifications-bell";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserSwitcher } from "@/components/user-switcher";
import type { NotificationEntry } from "@/db/queries";
import type { User } from "@/types";

export function TopBar({
  topicNames,
  notifications,
  unreadCount,
  members,
  currentUserId,
}: {
  topicNames: Record<string, string>;
  notifications: NotificationEntry[];
  unreadCount: number;
  members: User[];
  currentUserId: string;
}) {
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

  return (
    <header className="sticky top-0 z-30 h-11 border-b border-border bg-bg/85 backdrop-blur-md flex items-center gap-2 px-4 text-[13px]">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1 flex-1 min-w-0 font-mono font-medium text-text-subtle">
        <Link
          href="/"
          className="hover:text-accent transition-colors text-accent/70 font-semibold"
        >
          ~
        </Link>
        {crumbs.map((c, i) => (
          <span key={c.href} className="flex items-center gap-1">
            <ChevronRight className="w-3 h-3 text-text-subtle/50" strokeWidth={2.5} />
            {i === crumbs.length - 1 ? (
              <span className="text-text font-semibold truncate max-w-[200px]">
                {c.label}
              </span>
            ) : (
              <Link
                href={c.href}
                className="hover:text-text transition-colors truncate max-w-[160px]"
              >
                {c.label}
              </Link>
            )}
          </span>
        ))}
      </nav>

      {/* Right cluster */}
      <div className="flex items-center gap-1.5 shrink-0">
        <UserSwitcher members={members} currentUserId={currentUserId} />
        <button
          type="button"
          onClick={() => {
            const e = new KeyboardEvent("keydown", { key: "k", metaKey: true });
            window.dispatchEvent(e);
          }}
          className="flex items-center gap-2 px-2.5 py-1 rounded-md border border-border bg-surface hover:bg-surface-hover hover:border-border-strong transition-colors text-text-muted hover:text-text"
        >
          <Search className="w-3 h-3" strokeWidth={2.25} />
          <span className="text-[12px] font-medium">Search</span>
          <kbd>⌘K</kbd>
        </button>
        <NotificationsBell
          notifications={notifications}
          unreadCount={unreadCount}
        />
        <ThemeToggle />
        <button
          type="button"
          className="p-1.5 rounded-md text-text-muted hover:text-text hover:bg-surface-hover transition-colors"
          title="Help"
        >
          <HelpCircle className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
}
