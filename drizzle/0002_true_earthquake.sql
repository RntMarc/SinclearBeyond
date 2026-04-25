ALTER TABLE `ContactInfo` ADD `discordVisibility` tinyint DEFAULT 1 NOT NULL;
ALTER TABLE `ContactInfo` ADD `fluxerVisibility` tinyint DEFAULT 1 NOT NULL;
ALTER TABLE `ContactInfo` ADD `matrixVisibility` tinyint DEFAULT 1 NOT NULL;
ALTER TABLE `ContactInfo` ADD `signalVisibility` tinyint DEFAULT 1 NOT NULL;
ALTER TABLE `ContactInfo` ADD `whatsappVisibility` tinyint DEFAULT 1 NOT NULL;