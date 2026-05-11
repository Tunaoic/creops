import { getCurrentUser } from "@/db/queries";
import { SidebarClient } from "./sidebar-client";

export async function Sidebar() {
  const user = await getCurrentUser();
  return <SidebarClient userName={user.name} userEmail={user.email} />;
}
