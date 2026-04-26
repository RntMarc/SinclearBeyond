ALTER TABLE `User` ADD `birthday` datetime(3);--> statement-breakpoint
ALTER TABLE `User` ADD `birthdayVisibility` tinyint DEFAULT 1 NOT NULL;