CREATE TABLE `AlbumTrack` (
	`id` varchar(191) NOT NULL,
	`albumId` varchar(191) NOT NULL,
	`songId` varchar(191) NOT NULL,
	`trackNumber` tinyint,
	CONSTRAINT `AlbumTrack_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `EpisodeReview` (
	`id` varchar(191) NOT NULL,
	`episodeId` varchar(191) NOT NULL,
	`userId` varchar(191) NOT NULL,
	`rating` tinyint NOT NULL,
	`createdAt` datetime(3) NOT NULL,
	CONSTRAINT `EpisodeReview_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `SeriesEpisode` (
	`id` varchar(191) NOT NULL,
	`seriesId` varchar(191) NOT NULL,
	`seasonNumber` tinyint NOT NULL,
	`episodeNumber` tinyint NOT NULL,
	`title` varchar(255) NOT NULL,
	`externalId` varchar(191),
	`releaseDate` varchar(100),
	CONSTRAINT `SeriesEpisode_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `MediaItem` MODIFY COLUMN `format` enum('movie','series','album','song');