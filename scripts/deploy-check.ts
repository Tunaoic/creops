/**
 * Pre-deploy sanity check. Runs locally before you push to verify that:
 *   1. Required env vars are set
 *   2. DATABASE_URL points to a reachable libsql endpoint (or a local file)
 *   3. Clerk publishable key starts with pk_test_/pk_live_
 *   4. CLERK_SECRET_KEY starts with sk_test_/sk_live_
 *
 * Usage: `pnpm deploy:check`
 *
 * Exits with code 0 if everything looks good, 1 if anything is missing.
 * Doesn't actually deploy — just tells you whether your env is ready.
 */
import { createClient } from "@libsql/client";

type Check = { name: string; ok: boolean; detail: string; required: boolean };

async function main() {
  const checks: Check[] = [];

  // Clerk
  const pk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const sk = process.env.CLERK_SECRET_KEY;
  const whsec = process.env.CLERK_WEBHOOK_SECRET;

  checks.push({
    name: "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
    ok: !!pk && (pk.startsWith("pk_test_") || pk.startsWith("pk_live_")),
    detail: pk
      ? `${pk.slice(0, 12)}…`
      : "missing — sign up at https://dashboard.clerk.com",
    required: true,
  });
  checks.push({
    name: "CLERK_SECRET_KEY",
    ok: !!sk && (sk.startsWith("sk_test_") || sk.startsWith("sk_live_")),
    detail: sk ? `${sk.slice(0, 12)}…` : "missing",
    required: true,
  });
  checks.push({
    name: "CLERK_WEBHOOK_SECRET",
    ok: !!whsec && whsec.startsWith("whsec_"),
    detail: whsec
      ? `${whsec.slice(0, 12)}…`
      : "missing — Clerk dashboard → Webhooks → Endpoint → Signing Secret",
    required: true,
  });

  // Database
  const dbUrl = process.env.DATABASE_URL ?? "file:./local.db";
  const dbToken = process.env.DATABASE_AUTH_TOKEN;
  const isTurso = dbUrl.startsWith("libsql://") || dbUrl.startsWith("https://");

  checks.push({
    name: "DATABASE_URL",
    ok: !!dbUrl,
    detail: isTurso ? `Turso · ${dbUrl}` : `local file · ${dbUrl}`,
    required: true,
  });
  if (isTurso) {
    checks.push({
      name: "DATABASE_AUTH_TOKEN",
      ok: !!dbToken,
      detail: dbToken ? `${dbToken.slice(0, 20)}…` : "missing for Turso",
      required: true,
    });
  }

  // DB connectivity probe
  try {
    const client = createClient({ url: dbUrl, authToken: dbToken });
    const t0 = Date.now();
    await client.execute("SELECT 1");
    const latency = Date.now() - t0;
    client.close();
    checks.push({
      name: "Database reachable",
      ok: true,
      detail: `${latency}ms`,
      required: true,
    });
  } catch (e) {
    checks.push({
      name: "Database reachable",
      ok: false,
      detail: String((e as Error).message ?? e),
      required: true,
    });
  }

  // Print
  const pad = (s: string, n: number) =>
    s.length >= n ? s : s + " ".repeat(n - s.length);
  let allOk = true;
  console.log("");
  for (const c of checks) {
    const mark = c.ok ? "✅" : c.required ? "❌" : "⚠️ ";
    const status = c.ok ? "OK" : "MISSING";
    console.log(
      `${mark}  ${pad(c.name, 38)}  ${pad(status, 9)}  ${c.detail}`
    );
    if (!c.ok && c.required) allOk = false;
  }
  console.log("");

  if (allOk) {
    console.log("✅ Ready to deploy.");
    console.log("");
    console.log("Next steps:");
    console.log("  1. git push origin main");
    console.log("  2. Vercel auto-deploys on push (if connected)");
    console.log("  3. After deploy: GET <your-url>/api/health to verify");
    process.exit(0);
  } else {
    console.log("❌ Not ready yet. Fill the missing values in .env.local.");
    console.log("   See DEPLOY.md for how to provision each service.");
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("[deploy:check] unexpected error:", e);
  process.exit(1);
});
