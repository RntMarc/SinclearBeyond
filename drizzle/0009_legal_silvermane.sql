CREATE TABLE `feedPosts` (
	`id` varchar(191) NOT NULL,
	`userId` varchar(191) NOT NULL,
	`category` enum('music','video','news','other') NOT NULL,
	`content` text,
	`artist` varchar(255),
	`title` varchar(255),
	`spotifyUrl` text,
	`youtubeMusicUrl` text,
	`soundcloudUrl` text,
	`videoUrl` text,
	`videoPlatform` varchar(100),
	`newsTitle` varchar(255),
	`newsSite` varchar(255),
	`newsUrl` text,
	`otherTitle` varchar(255),
	`otherUrl` text,
	`visibility` tinyint NOT NULL DEFAULT 1,
	`createdAt` datetime(3) NOT NULL,
	`updatedAt` datetime(3) NOT NULL,
	CONSTRAINT `feedPosts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `TravelTrip` RENAME COLUMN `ID` TO `id`;--> statement-breakpoint
ALTER TABLE `TravelTrip` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `TravelAccommodation` MODIFY COLUMN `ID` varchar(191) NOT NULL;--> statement-breakpoint
ALTER TABLE `TravelEventTicket` MODIFY COLUMN `ID` varchar(191) NOT NULL;--> statement-breakpoint
ALTER TABLE `TravelEventTicket` MODIFY COLUMN `event` varchar(191);--> statement-breakpoint
ALTER TABLE `TravelEventTicket` MODIFY COLUMN `trip` varchar(191);--> statement-breakpoint
ALTER TABLE `TravelEvent` MODIFY COLUMN `ID` varchar(191) NOT NULL;--> statement-breakpoint
ALTER TABLE `TravelEvent` MODIFY COLUMN `trip` varchar(191) NOT NULL;--> statement-breakpoint
ALTER TABLE `TravelEvent` MODIFY COLUMN `ticket` varchar(191);--> statement-breakpoint
ALTER TABLE `TravelRelation` MODIFY COLUMN `ID` varchar(191) NOT NULL;--> statement-breakpoint
ALTER TABLE `TravelRelation` MODIFY COLUMN `tripid` varchar(191) NOT NULL;--> statement-breakpoint
ALTER TABLE `TravelRelation` MODIFY COLUMN `accommodation` varchar(191);--> statement-breakpoint
ALTER TABLE `TravelTrip` MODIFY COLUMN `id` varchar(191) NOT NULL;--> statement-breakpoint
ALTER TABLE `TravelTrip` MODIFY COLUMN `ticket` varchar(191);--> statement-breakpoint
ALTER TABLE `TravelTrip` ADD PRIMARY KEY(`id`);