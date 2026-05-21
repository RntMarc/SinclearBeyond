CREATE TABLE `PollQuestion` (
	`id` varchar(191) NOT NULL,
	`pollId` varchar(191) NOT NULL,
	`title` text NOT NULL,
	`type` enum('checkbox','toggle','single_choice','multiple_choice','text','textarea','email','address','number','date') NOT NULL,
	`order` tinyint NOT NULL DEFAULT 0,
	`createdAt` datetime(3) NOT NULL,
	CONSTRAINT `PollQuestion_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `PollOption` RENAME COLUMN `pollId` TO `questionId`;--> statement-breakpoint
ALTER TABLE `PollVote` MODIFY COLUMN `optionId` varchar(191);--> statement-breakpoint
ALTER TABLE `PollVote` MODIFY COLUMN `availability` enum('yes','maybe','no');--> statement-breakpoint
ALTER TABLE `PollOption` ADD `label` text;--> statement-breakpoint
ALTER TABLE `PollOption` ADD `dateValue` datetime(3);--> statement-breakpoint
ALTER TABLE `PollOption` ADD `order` tinyint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `PollVote` ADD `questionId` varchar(191) NOT NULL;--> statement-breakpoint
ALTER TABLE `PollVote` ADD `value` text;--> statement-breakpoint
ALTER TABLE `Poll` ADD `type` enum('appointment','survey') DEFAULT 'appointment' NOT NULL;--> statement-breakpoint
ALTER TABLE `Poll` ADD `description` text;--> statement-breakpoint
ALTER TABLE `PollOption` DROP COLUMN `startAt`;