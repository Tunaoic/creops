import Link from "next/link";
import { Bell, ArrowRight } from "lucide-react";
import { getNotificationsForCurrentUser } from "@/db/queries";
import { NotificationsList } from "@/components/notifications-list";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const notifications = await getNotificationsForCurrentUser(100);
  const unreadCount = notifications.filter((n) => !n.readAt).length;

  return (
    <div className="max-w-3xl mx-auto px-6 py-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.15em] text-text-subtle mb-1">
            INBOX · NOTIFICATIONS
          </div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notifications
            {unreadCount > 0 && (
              <span className="text-[12px] font-mono px-1.5 py-0.5 rounded bg-accent text-accent-fg">
                {unreadCount} new
              </span>
            )}
          </h1>
        </div>
      </div>

      <NotificationsList initial={notifications} />

      {notifications.length === 0 && (
        <div className="bg-surface rounded border border-border px-4 py-8 text-center">
          <Bell className="w-8 h-8 text-text-subtle/50 mx-auto mb-2" />
          <p className="text-[14px] text-text-muted">No notifications yet</p>
          <p className="text-[12px] text-text-subtle mt-1">
            Khi team assign / submit / reject / aired sẽ thấy ở đây.
          </p>
        </div>
      )}
    </div>
  );
}
