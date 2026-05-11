CREATE TABLE `MediaItem` (
	`id` varchar(191) NOT NULL,
	`type` enum('game','movie','music') NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`image` text,
	`externalId` varchar(191),
	`releaseDate` varchar(100),
	`creatorId` varchar(191) NOT NULL,
	`createdAt` datetime(3) NOT NULL,
	`updatedAt` datetime(3) NOT NULL,
	CONSTRAINT `MediaItem_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `MediaReview` (
	`id` varchar(191) NOT NULL,
	`itemId` varchar(191) NOT NULL,
	`userId` varchar(191) NOT NULL,
	`rating` tinyint NOT NULL,
	`comment` text,
	`platform` varchar(191),
	`createdAt` datetime(3) NOT NULL,
	CONSTRAINT `MediaReview_id` PRIMARY KEY(`id`)
);
