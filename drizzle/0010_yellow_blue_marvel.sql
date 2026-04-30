RENAME TABLE `feedPosts` TO `FeedPosts`;--> statement-breakpoint
ALTER TABLE `FeedPosts` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `FeedPosts` ADD PRIMARY KEY(`id`);