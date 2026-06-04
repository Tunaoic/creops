import { getSocialAccounts } from "@/db/queries";
import { ConnectionsClient } from "@/components/connections-client";

export const dynamic = "force-dynamic";

/**
 * Connections — workspace's connected platform accounts for
 * performance reporting. Renamed from /social-channels in the
 * architecture cleanup pass to disambiguate from /settings/channels
 * (publishing destination types).
 *
 * Phase 3a (this page): UI shell. Lists existing connections (empty
 * by default), shows 4 platform cards (YouTube enabled, others
 * "Coming soon"). Connect button writes a demo stub row marked
 * status="expired" so the user can see what the connected state
 * looks like without OAuth being wired.
 *
 * Phase 3b: Real Google OAuth → live YouTube connection.
 * Phase 3c: Vercel cron → pull metrics for aired deliverables.
 * Phase 3d: Aggregate report dashboard.
 */
export default async function ConnectionsPage() {
  const accounts = await getSocialAccounts();
  return <ConnectionsClient accounts={accounts} />;
}
