import { getAllUsers, getPendingInvites } from "@/db/queries";
import { MembersClient } from "@/components/members-client";

export const dynamic = "force-dynamic";

export default async function MembersPage() {
  const [users, pendingInvites] = await Promise.all([
    getAllUsers(),
    getPendingInvites(),
  ]);
  return (
    <MembersClient initialUsers={users} initialPendingInvites={pendingInvites} />
  );
}
