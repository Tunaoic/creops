import { db } from "@/db/client";
import { sql } from "drizzle-orm";

/**
 * Health check — `GET /api/health` returns the runtime config in a single
 * JSON blob. Use after every Vercel deploy to confirm:
 *   - Which optional services are wired (Clerk / Turso / R2 / Resend / Stripe)
 *   - DB is reachable
 *   - Process env contains expected keys
 *
 * Public — no auth required (it's the diagnostic for un-auth'd visitors
 * to figure out why their signup might be failing). Never returns secret
 * values, only booleans about whether keys are present.
 */
export async function GET() {
  const checks = {
    auth: {
      clerkConfigured: hasEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY") &&
        hasEnv("CLERK_SECRET_KEY"),
      webhookSecretSet: hasEnv("CLERK_WEBHOOK_SECRET"),
    },
    database: {
      mode: process.env.DATABASE_URL?.startsWith("libsql://") ? "turso" : "local-file",
      authTokenSet: hasEnv("DATABASE_AUTH_TOKEN"),
      reachable: false as boolean,
      latencyMs: 0,
    },
    storage: {
      r2Configured: hasEnv("R2_ACCOUNT_ID") && hasEnv("R2_BUCKET"),
    },
    email: {
      resendConfigured: hasEnv("RESEND_API_KEY"),
    },
    billing: {
      stripeConfigured: hasEnv("STRIPE_SECRET_KEY"),
    },
    runtime: {
      nodeVersion: process.version,
      vercelEnv: process.env.VERCEL_ENV ?? "local",
      vercelRegion: process.env.VERCEL_REGION ?? "n/a",
    },
  };

  // DB connectivity probe — cheap roundtrip (SELECT 1)
  const t0 = Date.now();
  try {
    await db.run(sql`SELECT 1`);
    checks.database.reachable = true;
    checks.database.latencyMs = Date.now() - t0;
  } catch (e) {
    checks.database.reachable = false;
    checks.database.latencyMs = -1;
    return Response.json(
      { status: "unhealthy", error: String(e), checks },
      { status: 500 }
    );
  }

  return Response.json({ status: "ok", checks });
}

function hasEnv(key: string): boolean {
  return Boolean(process.env[key] && process.env[key]!.length > 0);
}
