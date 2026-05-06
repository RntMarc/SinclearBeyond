CREATE TABLE `DiscoverBookmark` (
	`id` varchar(191) NOT NULL,
	`userId` varchar(191) NOT NULL,
	`placeId` varchar(191) NOT NULL,
	`createdAt` datetime(3) NOT NULL,
	CONSTRAINT `DiscoverBookmark_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `DiscoverGastronomy` (
	`id` varchar(191) NOT NULL,
	`placeId` varchar(191) NOT NULL,
	`cuisine` varchar(191),
	CONSTRAINT `DiscoverGastronomy_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `DiscoverPlace` (
	`id` varchar(191) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`category` enum('gastronomy','leisure') NOT NULL,
	`address` text,
	`latitude` double,
	`longitude` double,
	`osmId` bigint,
	`phone` varchar(191),
	`website` text,
	`email` varchar(191),
	`openingHours` text,
	`lastUpdated` datetime(3) NOT NULL,
	`creatorId` varchar(191) NOT NULL,
	`createdAt` datetime(3) NOT NULL,
	CONSTRAINT `DiscoverPlace_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `DiscoverReview` (
	`id` varchar(191) NOT NULL,
	`placeId` varchar(191) NOT NULL,
	`userId` varchar(191) NOT NULL,
	`rating` tinyint NOT NULL,
	`comment` text,
	`createdAt` datetime(3) NOT NULL,
	CONSTRAINT `DiscoverReview_id` PRIMARY KEY(`id`)
);
