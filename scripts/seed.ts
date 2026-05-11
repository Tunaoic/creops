import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "../src/db/schema";

const sqlite = new Database("./local.db");
const db = drizzle(sqlite, { schema });

async function seed() {
  console.log("🧹 Clearing all existing data...");
  // FK-safe order
  db.delete(schema.aiCutRegenLog).run();
  db.delete(schema.aiCutSuggestions).run();
  db.delete(schema.activityLog).run();
  db.delete(schema.comments).run();
  db.delete(schema.tasks).run();
  db.delete(schema.deliverableChannels).run();
  db.delete(schema.deliverables).run();
  db.delete(schema.sourceAssets).run();
  db.delete(schema.topics).run();
  db.delete(schema.channelStyleGuides).run();
  db.delete(schema.channels).run();
  db.delete(schema.workspaceSettings).run();
  db.delete(schema.users).run();
  db.delete(schema.workspaces).run();

  console.log("🌱 Creating empty workspace...");
  db.insert(schema.workspaces).values({
    id: "ws_1",
    name: "My Workspace",
    plan: "free",
  }).run();

  console.log("⚙️  Default workspace settings...");
  db.insert(schema.workspaceSettings).values({
    workspaceId: "ws_1",
    blockReasonDisplay: "name",
    defaultAssignees: {},
    aiCutRegenPerDay: 3,
  }).run();

  console.log("📺 Default channel platforms...");
  // 8 default platforms (creator can rename / add their own channels later)
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
    db.insert(schema.channels).values({
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
  sqlite.close();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
