CREATE TABLE `SubscriptionRelation` (
	`id` varchar(191) NOT NULL,
	`subscriptionId` varchar(191) NOT NULL,
	`userId` varchar(191),
	`isUser` tinyint NOT NULL DEFAULT 1,
	`userName` varchar(255),
	`hasPaid` tinyint NOT NULL DEFAULT 0,
	CONSTRAINT `SubscriptionRelation_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `Subscription` (
	`id` varchar(191) NOT NULL,
	`name` varchar(255) NOT NULL,
	`billingPeriodStart` date NOT NULL,
	`billingPeriodEnd` date NOT NULL,
	`basePrice` double NOT NULL,
	CONSTRAINT `Subscription_id` PRIMARY KEY(`id`)
);
