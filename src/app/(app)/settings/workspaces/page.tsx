import { getMyWorkspaces } from "@/db/queries";
import { getCurrentWorkspaceId } from "@/lib/current-workspace";
import { getCurrentUserIdAsync } from "@/lib/current-user";
import { WorkspacesClient } from "@/components/workspaces-client";

export const dynamic = "force-dynamic";

export default async function WorkspacesPage() {
  const [workspaces, activeWorkspaceId, currentUserId] = await Promise.all([
    getMyWorkspaces(),
    getCurrentWorkspaceId(),
    getCurrentUserIdAsync(),
  ]);
  return (
    <WorkspacesClient
      workspaces={workspaces}
      activeWorkspaceId={activeWorkspaceId}
      currentUserId={currentUserId ?? ""}
    />
  );
}
