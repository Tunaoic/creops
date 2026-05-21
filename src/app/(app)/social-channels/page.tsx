import { getSocialAccounts } from "@/db/queries";
import { SocialChannelsClient } from "@/components/social-channels-client";

export const dynamic = "force-dynamic";

/**
 * Social channels — workspace's connected platform accounts for
 * performance reporting.
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
export default async function SocialChannelsPage() {
  const accounts = await getSocialAccounts();
  return <SocialChannelsClient accounts={accounts} />;
}
