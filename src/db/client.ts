import "server-only";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

/**
 * Local SQLite (better-sqlite3) — sync API, fast.
 *
 * Production migration plan (Round 1b, separate commit):
 *   Switch to @libsql/client (Turso). Requires async refactor of every
 *   query call (~150 sites). Tracked in DEPLOY.md.
 */
const sqlite = new Database("./local.db");
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });
export { schema };
