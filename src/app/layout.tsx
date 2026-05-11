import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { TopBar } from "@/components/top-bar";
import { CommandPalette } from "@/components/command-palette";
import { StatusBar } from "@/components/status-bar";
import { ClerkAwareProvider } from "@/components/clerk-aware-provider";
import {
  getAllTopics,
  getAllUsers,
  getCurrentUser,
  getNotificationsForCurrentUser,
  getUnreadNotificationCount,
} from "@/db/queries";
import { getLocale } from "@/lib/i18n";
import { isClerkEnabled } from "@/lib/auth-config";

export const metadata: Metadata = {
  title: "CreOps — Content Workflow Platform",
  description:
    "1 source → N formats × M channels. Standardize content production for creator teams.",
};

export default async function RootLayout({
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

  // Inline script — runs synchronously before first paint to set [data-theme]
  // from localStorage. Prevents flash of wrong theme on reload.
  const themeBootstrap = `(function(){try{var t=localStorage.getItem('cowork-theme');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t)}else{document.documentElement.setAttribute('data-theme','dark')}}catch(e){}})();`;

  return (
    <ClerkAwareProvider clerkEnabled={clerkOn}>
      <html lang={locale} data-theme="dark" suppressHydrationWarning>
        <head>
          <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
        </head>
        <body className="min-h-screen">
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
            </div>
          </div>
          <CommandPalette topics={topics} />
          <Toaster
            position="top-center"
            richColors
            toastOptions={{
              className: "rounded-2xl border-border",
            }}
          />
        </body>
      </html>
    </ClerkAwareProvider>
  );
}
