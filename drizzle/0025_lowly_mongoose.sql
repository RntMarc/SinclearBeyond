CREATE TABLE `EventRelation` (
	`id` varchar(191) NOT NULL,
	`eventId` varchar(191) NOT NULL,
	`userId` varchar(191) NOT NULL,
	`createdAt` datetime(3) NOT NULL,
	CONSTRAINT `EventRelation_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `TravelEvent` MODIFY COLUMN `trip` varchar(191);