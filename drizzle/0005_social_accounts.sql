-- ============================================================================
-- Phase 3a — Social accounts table for connected platform reporting.
--
-- Workspace-scoped: any member sees connections; only owner manages them.
-- One PK per (workspace, platform, accountId) so a workspace can connect
-- multiple accounts on the same platform.
-- ============================================================================

CREATE TABLE `social_accounts` (
	`workspace_id` text NOT NULL,
	`platform` text NOT NULL,
	`account_id` text NOT NULL,
	`account_handle` text NOT NULL,
	`account_avatar_url` text,
	`access_token` text,
	`refresh_token` text,
	`token_expires_at` integer,
	`scopes` text DEFAULT '[]' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`connected_by` text,
	`connected_at` integer DEFAULT (unixepoch()) NOT NULL,
	`last_synced_at` integer,
	`metadata` text,
	PRIMARY KEY(`workspace_id`, `platform`, `account_id`),
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`connected_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
