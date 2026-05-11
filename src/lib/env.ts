import "server-only";

// Workflow-only platform — no API integrations yet.
// (AI / file storage will be added later when keys available.)

export const env = {
  NODE_ENV: (process.env.NODE_ENV ?? "development") as "development" | "production",
} as const;
