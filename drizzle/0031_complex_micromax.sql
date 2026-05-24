CREATE TABLE `FeedPostVote` (
	`id` varchar(191) NOT NULL,
	`postId` varchar(191) NOT NULL,
	`userId` varchar(191) NOT NULL,
	`createdAt` datetime(3) NOT NULL,
	CONSTRAINT `FeedPostVote_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ForumMember` (
	`id` varchar(191) NOT NULL,
	`forumId` varchar(191) NOT NULL,
	`userId` varchar(191) NOT NULL,
	`createdAt` datetime(3) NOT NULL,
	CONSTRAINT `ForumMember_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `Forum` (
	`id` varchar(191) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`image` longtext,
	`createdAt` datetime(3) NOT NULL,
	`updatedAt` datetime(3) NOT NULL,
	CONSTRAINT `Forum_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `FeedPosts` ADD `forumId` varchar(191) NOT NULL;