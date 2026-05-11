ALTER TABLE `tasks` ADD `watcher_ids` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `topics` ADD `watcher_ids` text DEFAULT '[]' NOT NULL;