CREATE TABLE `FeedbackSuggestion` (
	`id` varchar(191) NOT NULL,
	`userId` varchar(191) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`createdAt` datetime(3) NOT NULL,
	`updatedAt` datetime(3) NOT NULL,
	CONSTRAINT `FeedbackSuggestion_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `FeedbackVote` (
	`id` varchar(191) NOT NULL,
	`suggestionId` varchar(191) NOT NULL,
	`userId` varchar(191) NOT NULL,
	`createdAt` datetime(3) NOT NULL,
	CONSTRAINT `FeedbackVote_id` PRIMARY KEY(`id`)
);
