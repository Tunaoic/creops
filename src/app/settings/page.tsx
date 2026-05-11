import {
  getAllChannels,
  getAllUsers,
  getWorkspaceSettings,
} from "@/db/queries";
import { SettingsClient } from "@/components/settings-client";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [channels, users, settings] = await Promise.all([
    getAllChannels(),
    getAllUsers(),
    getWorkspaceSettings(),
  ]);
  return (
    <SettingsClient
      channels={channels}
      users={users}
      initialBlockReason={settings?.blockReasonDisplay ?? "name"}
    />
  );
}
