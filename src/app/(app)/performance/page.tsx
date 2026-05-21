import { getSocialAccounts } from "@/db/queries";
import { getDemoPerformance, type RangeKey } from "@/lib/performance-mock";
import { PerformanceClient } from "@/components/performance-client";

export const dynamic = "force-dynamic";

const VALID_RANGES: readonly RangeKey[] = ["7d", "30d", "90d"];

/**
 * Performance dashboard — aggregate metrics across all connected
 * channels for the current workspace.
 *
 * Phase 3 status: data is mocked via getDemoPerformance so the UX is
 * fully reviewable before OAuth + sync are wired (3b → 3c). When a
 * workspace has zero connected accounts, the page surfaces a banner
 * making it obvious the numbers are placeholders. Once 3c lands, swap
 * getDemoPerformance for a real query.
 */
export default async function PerformancePage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const params = await searchParams;
  const rangeParam = params.range as RangeKey | undefined;
  const range: RangeKey =
    rangeParam && VALID_RANGES.includes(rangeParam) ? rangeParam : "30d";

  const [snapshot, accounts] = await Promise.all([
    Promise.resolve(getDemoPerformance(range)),
    getSocialAccounts(),
  ]);

  const realActiveCount = accounts.filter((a) => a.status === "active").length;

  return (
    <PerformanceClient
      snapshot={snapshot}
      hasRealConnections={realActiveCount > 0}
    />
  );
}
