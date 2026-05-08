CREATE TABLE `UserPreferences` (
	`id` varchar(191) NOT NULL,
	`userId` varchar(191) NOT NULL,
	`language` varchar(10) NOT NULL DEFAULT 'de',
	`theme` enum('light','dark') NOT NULL DEFAULT 'dark',
	`primaryColor` varchar(7) NOT NULL DEFAULT '#7c3aed',
	CONSTRAINT `UserPreferences_id` PRIMARY KEY(`id`)
);
