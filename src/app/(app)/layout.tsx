import { Sidebar } from "@/components/sidebar";
import { TopBar } from "@/components/top-bar";
import { CommandPalette } from "@/components/command-palette";
import { StatusBar } from "@/components/status-bar";
import {
  getAllTopics,
  getAllUsers,
  getCurrentUser,
  getNotificationsForCurrentUser,
  getUnreadNotificationCount,
} from "@/db/queries";
import { getLocale } from "@/lib/i18n";
import { isClerkEnabled } from "@/lib/auth-config";

/**
 * Authed app shell — wraps every route that requires the dashboard chrome.
 *
 * Routes covered:
 *   /dashboard, /inbox, /notifications, /topics/*, /board, /calendar,
 *   /timeline, /search, /settings/*
 *
 * Public routes (/, /sign-in, /sign-up, /onboarding) bypass this layout
 * by living outside the (app) route group — they get the minimal root
 * layout only.
 */
export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [topics, members, currentUser, notifications, unreadCount, locale, clerkOn] =
    await Promise.all([
      getAllTopics(),
      getAllUsers(),
      getCurrentUser(),
      getNotificationsForCurrentUser(15),
      getUnreadNotificationCount(),
      getLocale(),
      isClerkEnabled(),
    ]);
  const topicNames = Object.fromEntries(topics.map((t) => [t.id, t.name]));

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar
          topicNames={topicNames}
          notifications={notifications}
          unreadCount={unreadCount}
          members={members}
          currentUserId={currentUser.id}
          locale={locale}
          showImpersonator={!clerkOn}
        />
        <main className="flex-1 min-w-0 overflow-y-auto">{children}</main>
        <StatusBar topicCount={topics.length} />
        <CommandPalette topics={topics} />
      </div>
    </div>
  );
}
