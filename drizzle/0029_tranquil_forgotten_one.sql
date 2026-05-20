CREATE TABLE `PollInvite` (
	`id` varchar(191) NOT NULL,
	`pollId` varchar(191) NOT NULL,
	`userId` varchar(191) NOT NULL,
	`isIndispensable` tinyint NOT NULL DEFAULT 0,
	`createdAt` datetime(3) NOT NULL,
	CONSTRAINT `PollInvite_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `PollOption` (
	`id` varchar(191) NOT NULL,
	`pollId` varchar(191) NOT NULL,
	`startAt` datetime(3) NOT NULL,
	`createdAt` datetime(3) NOT NULL,
	CONSTRAINT `PollOption_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `PollVote` (
	`id` varchar(191) NOT NULL,
	`optionId` varchar(191) NOT NULL,
	`userId` varchar(191) NOT NULL,
	`availability` enum('yes','maybe','no') NOT NULL,
	`updatedAt` datetime(3) NOT NULL,
	CONSTRAINT `PollVote_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `Poll` (
	`id` varchar(191) NOT NULL,
	`title` varchar(255) NOT NULL,
	`creatorId` varchar(191) NOT NULL,
	`finalizedOptionId` varchar(191),
	`createdAt` datetime(3) NOT NULL,
	`updatedAt` datetime(3) NOT NULL,
	CONSTRAINT `Poll_id` PRIMARY KEY(`id`)
);
