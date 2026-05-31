CREATE TABLE `PushSubscription` (
	`id` varchar(191) NOT NULL,
	`userId` varchar(191) NOT NULL,
	`endpoint` text NOT NULL,
	`p256dh` text NOT NULL,
	`auth` text NOT NULL,
	`createdAt` datetime(3) NOT NULL,
	CONSTRAINT `PushSubscription_id` PRIMARY KEY(`id`)
);
