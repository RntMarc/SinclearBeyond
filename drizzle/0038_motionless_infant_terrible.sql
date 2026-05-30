CREATE TABLE `Notification` (
	`id` varchar(191) NOT NULL,
	`userId` varchar(191) NOT NULL,
	`type` varchar(191) NOT NULL,
	`entityId` varchar(191) NOT NULL,
	`createdAt` datetime(3) NOT NULL,
	CONSTRAINT `Notification_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
DROP TABLE `ReadStatus`;--> statement-breakpoint
ALTER TABLE `UserPreferences` MODIFY COLUMN `primaryColor` varchar(20) NOT NULL DEFAULT 'var(--primary)';