import { getCurrentUser, getMyWorkspaces } from "@/db/queries";
import { getCurrentWorkspaceId } from "@/lib/current-workspace";
import { getLocale, withLocale } from "@/lib/i18n";
import { SidebarClient } from "./sidebar-client";

export async function Sidebar() {
  const [user, workspaces, activeWorkspaceId, locale] = await Promise.all([
    getCurrentUser(),
    getMyWorkspaces(),
    getCurrentWorkspaceId(),
    getLocale(),
  ]);
  const tr = withLocale(locale);
  return (
    <SidebarClient
      userName={user.name}
      userEmail={user.email}
      workspaces={workspaces}
      activeWorkspaceId={activeWorkspaceId}
      labels={{
        workspace: tr("workspace"),
        views: tr("views"),
        tools: tr("tools"),
        dashboard: tr("nav_dashboard"),
        inbox: tr("nav_inbox"),
        notifications: tr("nav_notifications"),
        topics: tr("nav_topics"),
        board: tr("nav_board"),
        calendar: tr("nav_calendar"),
        search: tr("nav_search"),
        settings: tr("nav_settings"),
        newTopic: tr("new_topic"),
      }}
    />
  );
}
