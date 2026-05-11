import type { Config } from "drizzle-kit";

/**
 * Drizzle config — local SQLite by default, Turso when DATABASE_URL is set
 * to a libsql:// URL. Migrations in /drizzle work for both since the schema
 * uses sqliteTable() throughout (libsql is SQLite-compatible).
 */
const url = process.env.DATABASE_URL;
const isTurso = url?.startsWith("libsql://") || url?.startsWith("https://");

export default (
  isTurso
    ? {
        schema: "./src/db/schema.ts",
        out: "./drizzle",
        dialect: "turso",
        dbCredentials: {
          url: url!,
          authToken: process.env.DATABASE_AUTH_TOKEN!,
        },
      }
    : {
        schema: "./src/db/schema.ts",
        out: "./drizzle",
        dialect: "sqlite",
        dbCredentials: {
          url: "./local.db",
        },
      }
) satisfies Config;
