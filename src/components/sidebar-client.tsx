"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FolderOpen, Search, Settings, Plus, LayoutGrid, CalendarDays, Inbox, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, hint: "G D" },
  { href: "/inbox", label: "Inbox", icon: Inbox, hint: "G I" },
  { href: "/notifications", label: "Notifications", icon: Bell, hint: "G N" },
];

const VIEWS = [
  { href: "/topics", label: "Topics", icon: FolderOpen, hint: "G T" },
  { href: "/board", label: "Board", icon: LayoutGrid, hint: "G B" },
  { href: "/calendar", label: "Calendar", icon: CalendarDays, hint: "G C" },
];

const TOOLS = [
  { href: "/search", label: "Search", icon: Search, hint: "⌘K" },
  { href: "/settings", label: "Settings", icon: Settings, hint: "⌘," },
];

export function SidebarClient({
  userName,
  userEmail,
}: {
  userName: string;
  userEmail: string;
}) {
  const pathname = usePathname();

  return (
    <aside className="w-60 border-r border-border bg-surface flex flex-col h-screen sticky top-0">
      {/* Brand */}
      <div className="px-4 py-3.5 border-b border-border flex items-center gap-2.5">
        <div className="relative w-7 h-7 rounded bg-bg border border-accent/40 flex items-center justify-center">
          <span className="font-mono font-bold text-[12px] text-accent leading-none">
            CO
          </span>
          <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_6px_var(--accent)]" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-[14px] font-semibold tracking-tight">creops</span>
          <span className="text-[11px] text-text-subtle font-mono uppercase tracking-wider">
            v0.2 · content workflow
          </span>
        </div>
      </div>

      {/* New Topic CTA */}
      <div className="p-3">
        <Link
          href="/topics/new"
          className="group flex items-center justify-between gap-2 w-full px-3 py-2 rounded-md bg-accent text-accent-fg text-[14px] font-semibold transition-all hover:bg-accent-hover hover:shadow-[0_0_0_3px_var(--accent-glow)]"
        >
          <span className="flex items-center gap-2">
            <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
            New Topic
          </span>
          <kbd className="text-[11px] font-mono opacity-60">⌘N</kbd>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 space-y-4 overflow-y-auto">
        <NavGroup label="Workspace" items={NAV_ITEMS} pathname={pathname} />
        <NavGroup label="Views" items={VIEWS} pathname={pathname} />
        <NavGroup label="Tools" items={TOOLS} pathname={pathname} />
      </nav>

      {/* User footer */}
      {/* (NavGroup component below) */}
      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-2.5 px-1">
          <div className="w-7 h-7 rounded-full bg-surface-elevated border border-border-strong flex items-center justify-center text-[12px] font-mono font-bold text-accent">
            {userName[0].toUpperCase()}
          </div>
          <div className="flex flex-col flex-1 min-w-0 leading-tight">
            <span className="text-[13px] font-medium truncate">{userName}</span>
            <span className="text-[11px] text-text-subtle font-mono truncate">
              {userEmail}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}

function NavGroup({
  label,
  items,
  pathname,
}: {
  label: string;
  items: Array<{ href: string; label: string; icon: typeof Plus; hint?: string }>;
  pathname: string;
}) {
  return (
    <div className="space-y-px">
      <div className="text-[11px] uppercase tracking-[0.18em] text-text-subtle font-mono font-semibold px-3 py-1.5">
        {label}
      </div>
      {items.map((item) => {
        const Icon = item.icon;
        const active =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "group flex items-center gap-2.5 px-3 py-[7px] rounded-md text-[14px] font-medium transition-colors",
              active
                ? "bg-surface-hover text-text border-l-2 border-accent -ml-px pl-[11px]"
                : "text-text-muted hover:bg-surface-hover hover:text-text"
            )}
          >
            <Icon className="w-3.5 h-3.5" strokeWidth={active ? 2.5 : 2.25} />
            <span className="flex-1">{item.label}</span>
            {item.hint && (
              <kbd className="text-[10px] font-mono font-semibold text-text-subtle opacity-0 group-hover:opacity-100 transition-opacity">
                {item.hint}
              </kbd>
            )}
          </Link>
        );
      })}
    </div>
  );
}
