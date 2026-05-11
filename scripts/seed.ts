import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "../src/db/schema";

/**
 * Seed script — creates an empty workspace with default channels and zero
 * users. The first user gets provisioned via the Clerk webhook in production
 * (each signup gets their own workspace, not this seed one), so this seed
 * is mostly for local dev to have a sane starting state.
 *
 * Works against both local SQLite file (default) and Turso cloud (set
 * DATABASE_URL + DATABASE_AUTH_TOKEN).
 */
const client = createClient({
  url: process.env.DATABASE_URL ?? "file:./local.db",
  authToken: process.env.DATABASE_AUTH_TOKEN,
});
const db = drizzle(client, { schema });

async function seed() {
  console.log("🧹 Clearing all existing data...");
  // FK-safe order
  await db.delete(schema.aiCutRegenLog).run();
  await db.delete(schema.aiCutSuggestions).run();
  await db.delete(schema.activityLog).run();
  await db.delete(schema.comments).run();
  await db.delete(schema.tasks).run();
  await db.delete(schema.deliverableChannels).run();
  await db.delete(schema.deliverables).run();
  await db.delete(schema.sourceAssets).run();
  await db.delete(schema.topics).run();
  await db.delete(schema.channelStyleGuides).run();
  await db.delete(schema.channels).run();
  await db.delete(schema.workspaceSettings).run();
  await db.delete(schema.users).run();
  await db.delete(schema.workspaces).run();

  console.log("🌱 Creating empty workspace...");
  await db.insert(schema.workspaces).values({
    id: "ws_1",
    name: "My Workspace",
    plan: "free",
  }).run();

  console.log("⚙️  Default workspace settings...");
  await db.insert(schema.workspaceSettings).values({
    workspaceId: "ws_1",
    blockReasonDisplay: "name",
    defaultAssignees: {},
    aiCutRegenPerDay: 3,
  }).run();

  console.log("📺 Default channel platforms...");
  const channels = [
    { id: "ch_yt", name: "YouTube", platform: "youtube" },
    { id: "ch_yt_shorts", name: "YouTube Shorts", platform: "youtube_shorts" },
    { id: "ch_tiktok", name: "TikTok", platform: "tiktok" },
    { id: "ch_ig_reel", name: "Instagram Reels", platform: "ig_reel" },
    { id: "ch_fb_group", name: "Facebook Group", platform: "fb_group" },
    { id: "ch_fb_page", name: "Facebook Page", platform: "fb_page" },
    { id: "ch_x", name: "X / Twitter", platform: "x_twitter" },
    { id: "ch_blog", name: "Blog", platform: "blog" },
  ];
  for (const c of channels) {
    await db.insert(schema.channels).values({
      id: c.id,
      workspaceId: "ws_1",
      name: c.name,
      platform: c.platform,
    }).run();
  }

  console.log("✅ Empty workspace ready!");
  console.log("   · 0 members — add via Settings → Team Members");
  console.log("   · 0 topics — add via + New Topic");
  console.log("   · 8 default channels");
  client.close();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
