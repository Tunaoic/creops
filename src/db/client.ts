import "server-only";
import { createClient, type Client } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

/**
 * libSQL client — single API for both local file and Turso cloud.
 *
 * Local dev (default):
 *   DATABASE_URL unset → file:./local.db (existing local.db works as-is,
 *   libsql is a SQLite-compatible fork)
 *
 * Production (Turso):
 *   DATABASE_URL=libsql://your-db.turso.io
 *   DATABASE_AUTH_TOKEN=eyJ...
 *
 * All query call sites use `await` since libsql is async even for
 * local files (the underlying driver does internal async I/O).
 */
// Treat empty string as "unset" — Playwright passes DATABASE_URL= to
// override .env.local back to local SQLite, and we shouldn't crash
// trying to parse "" as a libsql URL.
const url = process.env.DATABASE_URL?.trim() || "file:./local.db";
const authToken = process.env.DATABASE_AUTH_TOKEN?.trim() || undefined;

export const sqlClient: Client = createClient({ url, authToken });
export const db = drizzle(sqlClient, { schema });
export { schema };
