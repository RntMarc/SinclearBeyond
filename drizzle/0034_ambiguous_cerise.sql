CREATE TABLE `NewsArticle` (
	`id` varchar(191) NOT NULL,
	`title` varchar(255) NOT NULL,
	`url` text NOT NULL,
	`sourceName` varchar(255),
	`sourceIcon` text,
	`savedAt` datetime(3) NOT NULL,
	CONSTRAINT `NewsArticle_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `NewsUpvote` (
	`id` varchar(191) NOT NULL,
	`articleId` varchar(191) NOT NULL,
	`userId` varchar(191) NOT NULL,
	`createdAt` datetime(3) NOT NULL,
	CONSTRAINT `NewsUpvote_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `RssSource` (
	`id` varchar(191) NOT NULL,
	`name` varchar(255) NOT NULL,
	`url` text NOT NULL,
	`itemsPerPage` tinyint NOT NULL DEFAULT 10,
	`createdAt` datetime(3) NOT NULL,
	CONSTRAINT `RssSource_id` PRIMARY KEY(`id`)
);
