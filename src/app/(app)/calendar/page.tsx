import {
  getScheduledItems,
  getProductionItems,
  getAllChannels,
  getAllUsers,
  getCurrentUser,
} from "@/db/queries";
import { CalendarView } from "@/components/calendar-view";

export const dynamic = "force-dynamic";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string; y?: string; mode?: string; mine?: string }>;
}) {
  const params = await searchParams;
  const now = new Date();
  const month = params.m ? parseInt(params.m) : now.getMonth();
  const year = params.y ? parseInt(params.y) : now.getFullYear();
  const initialMode = params.mode === "production" ? "production" : "air";
  const initialMine = params.mine === "1";

  const [airItems, prodItems, channels, users, currentUser] = await Promise.all([
    getScheduledItems(),
    getProductionItems(),
    getAllChannels(),
    getAllUsers(),
    getCurrentUser(),
  ]);

  return (
    <CalendarView
      airItems={airItems}
      prodItems={prodItems}
      channels={channels}
      users={users}
      currentUserId={currentUser.id}
      month={month}
      year={year}
      initialMode={initialMode}
      initialMine={initialMine}
    />
  );
}
