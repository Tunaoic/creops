import "server-only";
import { cookies } from "next/headers";

export type Locale = "en" | "vi";

export const LOCALE_COOKIE = "creops-lang";
export const DEFAULT_LOCALE: Locale = "vi";

/**
 * Resolve current locale from cookie. Default = vi (team is Vietnamese).
 * Server-side only — call from RSC, route handlers, or server actions.
 */
export async function getLocale(): Promise<Locale> {
  const c = await cookies();
  const v = c.get(LOCALE_COOKIE)?.value;
  if (v === "en" || v === "vi") return v;
  return DEFAULT_LOCALE;
}

// ----------------------------------------------------------------------------
// Dictionary
// Add keys here as you translate more strings. Each entry must have both
// languages — TS will catch missing translations at compile time.
// ----------------------------------------------------------------------------

export const dict = {
  // Sidebar groups
  workspace: { en: "Workspace", vi: "Không gian" },
  views: { en: "Views", vi: "Chế độ xem" },
  tools: { en: "Tools", vi: "Công cụ" },

  // Sidebar nav items
  nav_dashboard: { en: "Dashboard", vi: "Tổng quan" },
  nav_inbox: { en: "Inbox", vi: "Hộp đến" },
  nav_notifications: { en: "Notifications", vi: "Thông báo" },
  nav_topics: { en: "Topics", vi: "Chủ đề" },
  nav_board: { en: "Board", vi: "Bảng" },
  nav_calendar: { en: "Calendar", vi: "Lịch" },
  nav_search: { en: "Search", vi: "Tìm kiếm" },
  nav_settings: { en: "Settings", vi: "Cài đặt" },
  new_topic: { en: "New Topic", vi: "Chủ đề mới" },

  // TopBar
  search_placeholder: { en: "Search", vi: "Tìm kiếm" },
  help: { en: "Help", vi: "Trợ giúp" },

  // Dashboard
  mission_control: { en: "Mission Control", vi: "Trung tâm điều hành" },
  kpi_my_tasks: { en: "MY TASKS", vi: "TASK CỦA TÔI" },
  kpi_active_topics: { en: "ACTIVE TOPICS", vi: "CHỦ ĐỀ ĐANG LÀM" },
  kpi_needs_review: { en: "NEEDS REVIEW", vi: "CẦN DUYỆT" },
  kpi_aired_7d: { en: "AIRED · 7D", vi: "ĐÃ ĐĂNG · 7N" },
  section_in_progress: { en: "In Progress", vi: "Đang làm" },
  section_awaiting_review: { en: "Awaiting Your Review", vi: "Chờ bạn duyệt" },
  section_aired_7d: { en: "Aired · 7d", vi: "Đã đăng · 7N" },
  section_system: { en: "System", vi: "Hệ thống" },
  tasks_for: { en: "Tasks for", vi: "Task cho" },
  all_clear: { en: "all clear", vi: "hoàn tất" },
  blocking: { en: "blocking", vi: "đang chặn" },
  clear: { en: "clear", vi: "sẵn sàng" },
  in_progress_short: { en: "in progress", vi: "đang làm" },

  // Inbox
  inbox_your_queue: { en: "Your Queue", vi: "Hàng đợi của bạn" },
  inbox_my_tasks: { en: "MY TASKS", vi: "TASK CỦA TÔI" },
  inbox_awaiting_review: { en: "AWAITING YOUR REVIEW", vi: "CHỜ BẠN DUYỆT" },
  inbox_waiting_team: { en: "WAITING ON TEAM", vi: "CHỜ TEAM" },
  inbox_no_tasks: { en: "No tasks assigned to you. ✓", vi: "Không có task nào. ✓" },
  inbox_no_blockers: { en: "No team blockers.", vi: "Không có gì chờ team." },

  // Date buckets (Inbox)
  bucket_overdue: { en: "Overdue", vi: "Quá hạn" },
  bucket_today: { en: "Today", vi: "Hôm nay" },
  bucket_tomorrow: { en: "Tomorrow", vi: "Ngày mai" },
  bucket_this_week: { en: "This Week", vi: "Tuần này" },
  bucket_later: { en: "Later", vi: "Sau" },
  bucket_no_date: { en: "No Due Date", vi: "Không có hạn" },

  // Common buttons / labels
  save: { en: "Save", vi: "Lưu" },
  cancel: { en: "Cancel", vi: "Hủy" },
  open: { en: "Open", vi: "Mở" },
  back: { en: "Back", vi: "Quay lại" },
  approve: { en: "Approve", vi: "Duyệt" },
  reject: { en: "Reject", vi: "Từ chối" },
  submit: { en: "Submit", vi: "Gửi" },

  // Lang toggle
  lang_toggle_title_to_vi: { en: "Switch to Vietnamese", vi: "Chuyển sang Tiếng Anh" },
  lang_toggle_title_to_en: { en: "Switch to English", vi: "Chuyển sang Tiếng Anh" },
} as const;

export type DictKey = keyof typeof dict;

/**
 * Translate a key for a given locale.
 * Usage:
 *   t(locale, "nav_dashboard") → "Dashboard" | "Tổng quan"
 */
export function t(locale: Locale, key: DictKey): string {
  return dict[key][locale];
}

/**
 * Build a curried translator bound to a single locale — handy when passing
 * many strings into a component:
 *   const tr = withLocale(locale);
 *   tr("nav_dashboard")
 */
export function withLocale(locale: Locale) {
  return (key: DictKey): string => dict[key][locale];
}
