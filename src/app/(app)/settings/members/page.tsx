import { getAllUsers } from "@/db/queries";
import { MembersClient } from "@/components/members-client";

export const dynamic = "force-dynamic";

export default async function MembersPage() {
  const users = await getAllUsers();
  return <MembersClient initialUsers={users} />;
}
