import Link from "next/link";
import { Bell, ArrowRight } from "lucide-react";
import { getNotificationsForCurrentUser } from "@/db/queries";
import { NotificationsList } from "@/components/notifications-list";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const notifications = await getNotificationsForCurrentUser(100);
  const unreadCount = notifications.filter((n) => !n.readAt).length;

  return (
    <div className="max-w-3xl mx-auto px-8 py-7 space-y-5">
      <div>
        <p className="text-[14px] text-text-muted mb-1">Inbox</p>
        <h1 className="text-title-2 text-text flex items-baseline gap-2.5">
          Notifications
          {unreadCount > 0 && (
            <span className="text-[14px] font-medium px-2.5 py-0.5 rounded-full bg-accent text-accent-fg">
              {unreadCount} new
            </span>
          )}
        </h1>
      </div>

      <NotificationsList initial={notifications} />

      {notifications.length === 0 && (
        <div className="bg-surface rounded-2xl border border-border px-5 py-12 text-center">
          <Bell className="w-8 h-8 text-text-subtle mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-[15px] text-text mb-1">No notifications yet</p>
          <p className="text-[13px] text-text-muted max-w-sm mx-auto">
            You&apos;ll see updates here when teammates assign, submit, approve, reject, or air things.
          </p>
        </div>
      )}
    </div>
  );
}
