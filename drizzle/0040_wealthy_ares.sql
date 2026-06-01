CREATE TABLE `RecipeBookmark` (
	`id` varchar(191) NOT NULL,
	`userId` varchar(191) NOT NULL,
	`recipeId` varchar(191) NOT NULL,
	`createdAt` datetime(3) NOT NULL,
	CONSTRAINT `RecipeBookmark_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `RecipeIngredient` (
	`id` varchar(191) NOT NULL,
	`recipeId` varchar(191) NOT NULL,
	`amount` double NOT NULL,
	`unit` varchar(50) NOT NULL,
	`name` varchar(255) NOT NULL,
	`order` tinyint NOT NULL DEFAULT 0,
	CONSTRAINT `RecipeIngredient_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `RecipeReview` (
	`id` varchar(191) NOT NULL,
	`recipeId` varchar(191) NOT NULL,
	`userId` varchar(191) NOT NULL,
	`rating` tinyint NOT NULL,
	`comment` text,
	`createdAt` datetime(3) NOT NULL,
	CONSTRAINT `RecipeReview_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `RecipeStep` (
	`id` varchar(191) NOT NULL,
	`recipeId` varchar(191) NOT NULL,
	`category` enum('vorbereitung','hauptgang','beilage','garnierung','sonstiges') NOT NULL,
	`title` varchar(255),
	`description` text NOT NULL,
	`order` tinyint NOT NULL DEFAULT 0,
	CONSTRAINT `RecipeStep_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `Recipe` (
	`id` varchar(191) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`category` enum('vorspeisen','hauptgerichte','desserts','salate','suppen','backen','fruehstueck','getraenke','sonstiges') NOT NULL,
	`dietaryTags` varchar(500),
	`image` longtext,
	`creatorId` varchar(191) NOT NULL,
	`createdAt` datetime(3) NOT NULL,
	`updatedAt` datetime(3) NOT NULL,
	CONSTRAINT `Recipe_id` PRIMARY KEY(`id`)
);
