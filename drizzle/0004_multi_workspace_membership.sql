-- ============================================================================
-- Round 2c — Multi-workspace membership
--
-- Refactors the 1:1 user→workspace relationship into N:N via a join table.
-- Migration is data-preserving: existing single-workspace users become
-- single-membership users with their previous role/access intact.
--
-- SQLite ALTER TABLE DROP COLUMN errors when the column is part of a FK,
-- so we use the standard "rebuild table" pattern for `users` instead of
-- naked DROP COLUMN. PRAGMA foreign_keys is toggled to keep child rows
-- intact across the swap (other tables reference `users.id`).
-- ============================================================================

-- 1. Create the join table.
CREATE TABLE `workspace_members` (
	`user_id` text NOT NULL,
	`workspace_id` text NOT NULL,
	`roles` text DEFAULT '[]' NOT NULL,
	`access_level` text DEFAULT 'full' NOT NULL,
	`joined_at` integer DEFAULT (unixepoch()) NOT NULL,
	PRIMARY KEY(`user_id`, `workspace_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint

-- 2. Add owner_id to workspaces (nullable, no FK — handled in app code).
ALTER TABLE `workspaces` ADD `owner_id` text;
--> statement-breakpoint

-- 3. Backfill workspace_members from each user's current single workspace.
INSERT INTO `workspace_members` (`user_id`, `workspace_id`, `roles`, `access_level`, `joined_at`)
SELECT `id`, `workspace_id`, `roles`, `access_level`, COALESCE(`created_at`, unixepoch())
FROM `users`
WHERE `workspace_id` IS NOT NULL;
--> statement-breakpoint

-- 4. Backfill workspaces.owner_id to the oldest member.
UPDATE `workspaces`
SET `owner_id` = (
	SELECT `user_id` FROM `workspace_members`
	WHERE `workspace_members`.`workspace_id` = `workspaces`.`id`
	ORDER BY `joined_at` ASC, `user_id` ASC
	LIMIT 1
);
--> statement-breakpoint

-- 5. Rebuild `users` table to drop workspace_id/roles/access_level
--    and add active_workspace_id. SQLite can't DROP COLUMN when a FK
--    references it, so we copy → drop → rename.
PRAGMA foreign_keys=OFF;
--> statement-breakpoint
CREATE TABLE `__new_users` (
	`id` text PRIMARY KEY NOT NULL,
	`active_workspace_id` text,
	`clerk_user_id` text,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`avatar_url` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`active_workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_users` (`id`, `active_workspace_id`, `clerk_user_id`, `name`, `email`, `avatar_url`, `created_at`)
SELECT `id`, `workspace_id`, `clerk_user_id`, `name`, `email`, `avatar_url`, `created_at` FROM `users`;
--> statement-breakpoint
DROP TABLE `users`;
--> statement-breakpoint
ALTER TABLE `__new_users` RENAME TO `users`;
--> statement-breakpoint
CREATE UNIQUE INDEX `users_clerk_user_id_unique` ON `users` (`clerk_user_id`);
--> statement-breakpoint
PRAGMA foreign_keys=ON;
