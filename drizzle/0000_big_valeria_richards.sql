CREATE TABLE `CloseFriend` (
	`id` varchar(191) NOT NULL,
	`userId` varchar(191) NOT NULL,
	`friendId` varchar(191) NOT NULL,
	`createdAt` datetime(3) NOT NULL,
	CONSTRAINT `CloseFriend_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ContactInfo` (
	`id` varchar(191) NOT NULL,
	`userId` varchar(191) NOT NULL,
	`discordHandle` varchar(191),
	`fluxerHandle` varchar(191),
	`matrixHandle` varchar(191),
	`signalNumber` varchar(191),
	`whatsappNumber` varchar(191),
	CONSTRAINT `ContactInfo_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `Event` (
	`id` varchar(191) NOT NULL,
	`title` varchar(191) NOT NULL,
	`description` varchar(191),
	`startAt` datetime(3) NOT NULL,
	`endAt` datetime(3),
	`allDay` tinyint NOT NULL DEFAULT 0,
	`createdAt` datetime(3) NOT NULL,
	`creatorId` varchar(191) NOT NULL,
	CONSTRAINT `Event_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `OtpToken` (
	`id` varchar(191) NOT NULL,
	`email` varchar(191) NOT NULL,
	`code` varchar(6) NOT NULL,
	`expiresAt` datetime(3) NOT NULL,
	`usedAt` datetime(3),
	`createdAt` datetime(3) NOT NULL,
	CONSTRAINT `OtpToken_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `User` (
	`id` varchar(191) NOT NULL,
	`email` varchar(191) NOT NULL,
	`passwordHash` varchar(191) NOT NULL,
	`displayName` varchar(191) NOT NULL,
	`createdAt` datetime(3) NOT NULL,
	CONSTRAINT `User_id` PRIMARY KEY(`id`)
);
