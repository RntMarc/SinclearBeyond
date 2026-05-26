ALTER TABLE `ContactInfo` ADD `matrixUser` varchar(191);--> statement-breakpoint
ALTER TABLE `ContactInfo` ADD `matrixHomeserver` varchar(191);--> statement-breakpoint
ALTER TABLE `ContactInfo` DROP COLUMN `matrixHandle`;