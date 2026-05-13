CREATE TABLE `ChangelogEntry` (
	`id` varchar(191) NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`category` enum('feature','bugfix','improvement','maintenance','security') NOT NULL,
	`createdAt` datetime(3) NOT NULL,
	CONSTRAINT `ChangelogEntry_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ReadStatus` (
	`id` varchar(191) NOT NULL,
	`userId` varchar(191) NOT NULL,
	`entityType` varchar(191) NOT NULL,
	`entityId` varchar(191) NOT NULL,
	`createdAt` datetime(3) NOT NULL,
	CONSTRAINT `ReadStatus_id` PRIMARY KEY(`id`)
);
