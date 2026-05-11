import { headers } from "next/headers";
import { Webhook } from "svix";
import { db, schema } from "@/db/client";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";

/**
 * Clerk webhook receiver — provisions our internal user + workspace on
 * Clerk's `user.created` event.
 *
 * Setup (one-time on Clerk dashboard):
 *   1. Webhooks → Add Endpoint → URL: https://<your-domain>/api/webhooks/clerk
 *   2. Subscribe to events: user.created, user.updated, user.deleted
 *   3. Copy "Signing Secret" → set as CLERK_WEBHOOK_SECRET in Vercel env
 *
 * The handler verifies signatures via svix to prevent spoofing. Each
 * new sign-up gets their own workspace + a user row tagged with their
 * Clerk ID, then redirected through /onboarding to name the workspace.
 */
type ClerkWebhookEvent = {
  type: string;
  data: {
    id: string;
    email_addresses?: Array<{ email_address: string; id: string }>;
    primary_email_address_id?: string;
    first_name?: string | null;
    last_name?: string | null;
    image_url?: string | null;
  };
};

export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[clerk webhook] CLERK_WEBHOOK_SECRET not set");
    return new Response("Misconfigured", { status: 500 });
  }

  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  const body = await req.text();
  let evt: ClerkWebhookEvent;
  try {
    const wh = new Webhook(secret);
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as ClerkWebhookEvent;
  } catch (err) {
    console.error("[clerk webhook] verify failed:", err);
    return new Response("Invalid signature", { status: 401 });
  }

  switch (evt.type) {
    case "user.created":
      await provisionNewUser(evt.data);
      break;
    case "user.updated":
      await syncUserProfile(evt.data);
      break;
    case "user.deleted":
      // Soft-handle — onDelete:set null on FKs keeps data, just nukes user row
      db.delete(schema.users).where(eq(schema.users.clerkUserId, evt.data.id)).run();
      break;
  }

  return new Response("ok", { status: 200 });
}

async function provisionNewUser(data: ClerkWebhookEvent["data"]) {
  // Skip if already provisioned (Clerk can fire user.created twice)
  const existing = db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.clerkUserId, data.id))
    .get();
  if (existing) return;

  const email = pickEmail(data);
  const name = [data.first_name, data.last_name].filter(Boolean).join(" ") ||
    email.split("@")[0] ||
    "New user";

  // Each new sign-up gets their own workspace. They can rename it on
  // /onboarding. Multi-workspace per user is a Round 2 feature.
  const workspaceId = `ws_${randomUUID().slice(0, 8)}`;
  db.insert(schema.workspaces)
    .values({
      id: workspaceId,
      name: `${name}'s Workspace`,
      plan: "free",
    })
    .run();

  // Default workspace settings
  db.insert(schema.workspaceSettings)
    .values({
      workspaceId,
      blockReasonDisplay: "name",
      defaultAssignees: {},
      aiCutRegenPerDay: 3,
    })
    .run();

  // Default channels (mirror seed script)
  const defaultChannels = [
    { id: `ch_${randomUUID().slice(0, 6)}`, name: "YouTube", platform: "youtube" },
    { id: `ch_${randomUUID().slice(0, 6)}`, name: "TikTok", platform: "tiktok" },
    { id: `ch_${randomUUID().slice(0, 6)}`, name: "Instagram Reels", platform: "ig_reel" },
    { id: `ch_${randomUUID().slice(0, 6)}`, name: "Blog", platform: "blog" },
  ];
  for (const c of defaultChannels) {
    db.insert(schema.channels)
      .values({ id: c.id, workspaceId, name: c.name, platform: c.platform })
      .run();
  }

  // The user — gets creator role by default since they own the workspace
  db.insert(schema.users)
    .values({
      id: `u_${randomUUID().slice(0, 8)}`,
      workspaceId,
      clerkUserId: data.id,
      name,
      email,
      avatarUrl: data.image_url ?? null,
      roles: ["creator"],
      accessLevel: "full",
    })
    .run();
}

async function syncUserProfile(data: ClerkWebhookEvent["data"]) {
  const u = db
    .select()
    .from(schema.users)
    .where(eq(schema.users.clerkUserId, data.id))
    .get();
  if (!u) return; // not provisioned yet — user.created will handle

  const email = pickEmail(data);
  const name = [data.first_name, data.last_name].filter(Boolean).join(" ") ||
    email.split("@")[0] ||
    u.name;

  db.update(schema.users)
    .set({
      name,
      email,
      avatarUrl: data.image_url ?? u.avatarUrl,
    })
    .where(eq(schema.users.clerkUserId, data.id))
    .run();
}

function pickEmail(data: ClerkWebhookEvent["data"]): string {
  const primaryId = data.primary_email_address_id;
  const primary = data.email_addresses?.find((e) => e.id === primaryId);
  return primary?.email_address ?? data.email_addresses?.[0]?.email_address ?? "";
}
