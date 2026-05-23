CREATE TABLE `OfficeCollaborator` (
	`id` varchar(191) NOT NULL,
	`documentId` varchar(191) NOT NULL,
	`userId` varchar(191) NOT NULL,
	`color` varchar(7) NOT NULL,
	`lastActiveAt` datetime(3) NOT NULL,
	CONSTRAINT `OfficeCollaborator_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `OfficeDocument` (
	`id` varchar(191) NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` longtext,
	`creatorId` varchar(191) NOT NULL,
	`createdAt` datetime(3) NOT NULL,
	`updatedAt` datetime(3) NOT NULL,
	CONSTRAINT `OfficeDocument_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `OfficeVersion` (
	`id` varchar(191) NOT NULL,
	`documentId` varchar(191) NOT NULL,
	`content` longtext NOT NULL,
	`label` varchar(255),
	`createdAt` datetime(3) NOT NULL,
	CONSTRAINT `OfficeVersion_id` PRIMARY KEY(`id`)
);
