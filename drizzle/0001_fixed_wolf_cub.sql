CREATE TABLE `EventPermission` (
	`id` varchar(191) NOT NULL,
	`eventId` varchar(191) NOT NULL,
	`userId` varchar(191) NOT NULL,
	`canView` tinyint NOT NULL DEFAULT 1,
	`canEdit` tinyint NOT NULL DEFAULT 0,
	`createdAt` datetime(3) NOT NULL,
	CONSTRAINT `EventPermission_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `Event` ADD `isPublic` tinyint DEFAULT 1 NOT NULL;