"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderOpen,
  Search,
  Settings,
  Plus,
  LayoutGrid,
  CalendarDays,
  Inbox,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { WorkspaceSwitcher } from "@/components/workspace-switcher";
import type { WorkspaceSummary } from "@/types";

export interface SidebarLabels {
  workspace: string;
  views: string;
  tools: string;
  dashboard: string;
  inbox: string;
  notifications: string;
  topics: string;
  board: string;
  calendar: string;
  search: string;
  settings: string;
  newTopic: string;
}

export function SidebarClient({
  userName,
  userEmail,
  workspaces,
  activeWorkspaceId,
  labels,
}: {
  userName: string;
  userEmail: string;
  workspaces: WorkspaceSummary[];
  activeWorkspaceId: string;
  labels: SidebarLabels;
}) {
  const NAV_ITEMS = [
    {
      href: "/dashboard",
      label: labels.dashboard,
      icon: LayoutDashboard,
      hint: "G D",
    },
    { href: "/inbox", label: labels.inbox, icon: Inbox, hint: "G I" },
    {
      href: "/notifications",
      label: labels.notifications,
      icon: Bell,
      hint: "G N",
    },
  ];

  const VIEWS = [
    { href: "/topics", label: labels.topics, icon: FolderOpen, hint: "G T" },
    { href: "/board", label: labels.board, icon: LayoutGrid, hint: "G B" },
    {
      href: "/calendar",
      label: labels.calendar,
      icon: CalendarDays,
      hint: "G C",
    },
  ];

  const TOOLS = [
    { href: "/search", label: labels.search, icon: Search, hint: "⌘K" },
    { href: "/settings", label: labels.settings, icon: Settings, hint: "⌘," },
  ];

  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-border bg-surface flex flex-col h-screen sticky top-0">
      {/* Workspace switcher — top of sidebar, the highest-level container.
          Hides the CreOps brand chrome behind it; brand identity lives in
          the marketing site / login page, not the working surface. */}
      <WorkspaceSwitcher
        workspaces={workspaces}
        activeWorkspaceId={activeWorkspaceId}
      />

      {/* New Topic CTA */}
      <div className="px-3 pb-3 pt-1">
        <Link
          href="/topics/new"
          className="group flex items-center justify-between gap-2 w-full pl-4 pr-3 py-2 rounded-full bg-accent text-accent-fg text-[14px] font-medium transition-opacity hover:opacity-88"
        >
          <span className="flex items-center gap-2">
            <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
            {labels.newTopic}
          </span>
          <kbd className="text-[10px] font-medium opacity-70 bg-transparent border-0">
            ⌘N
          </kbd>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 space-y-5 overflow-y-auto pb-4">
        <NavGroup
          label={labels.workspace}
          items={NAV_ITEMS}
          pathname={pathname}
        />
        <NavGroup label={labels.views} items={VIEWS} pathname={pathname} />
        <NavGroup label={labels.tools} items={TOOLS} pathname={pathname} />
      </nav>

      {/* User footer */}
      <div className="px-3 pt-3 pb-4 border-t border-border">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-surface-elevated border border-border flex items-center justify-center text-[13px] font-medium text-text">
            {userName[0]?.toUpperCase()}
          </div>
          <div className="flex flex-col flex-1 min-w-0 leading-tight">
            <span className="text-[14px] font-medium truncate">{userName}</span>
            <span className="text-[12px] text-text-subtle truncate">
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
    <div>
      <div className="text-[12px] text-text-subtle px-3 pb-1.5 font-medium">
        {label}
      </div>
      <div className="space-y-px">
        {items.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 px-3 py-2 rounded-lg text-[14px] transition-colors",
                active
                  ? "bg-accent/10 text-accent font-medium"
                  : "text-text-muted hover:bg-surface-hover hover:text-text"
              )}
            >
              <Icon className="w-4 h-4" strokeWidth={active ? 2 : 1.75} />
              <span className="flex-1">{item.label}</span>
              {item.hint && (
                <kbd className="text-[10px] font-medium text-text-subtle opacity-0 group-hover:opacity-100 transition-opacity bg-transparent border-0 p-0">
                  {item.hint}
                </kbd>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
