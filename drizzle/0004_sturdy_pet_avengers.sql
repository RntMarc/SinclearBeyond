CREATE TABLE `SocialInfo` (
	`id` varchar(191) NOT NULL,
	`userId` varchar(191) NOT NULL,
	`unsplashHandle` varchar(191),
	`instagramHandle` varchar(191),
	`mastodonHandle` varchar(191),
	`pixelfedHandle` varchar(191),
	`blueskyHandle` varchar(191),
	`youtubeHandle` varchar(191),
	`twitchHandle` varchar(191),
	`unsplashVisibility` tinyint NOT NULL DEFAULT 1,
	`instagramVisibility` tinyint NOT NULL DEFAULT 1,
	`mastodonVisibility` tinyint NOT NULL DEFAULT 1,
	`pixelfedVisibility` tinyint NOT NULL DEFAULT 1,
	`blueskyVisibility` tinyint NOT NULL DEFAULT 1,
	`youtubeVisibility` tinyint NOT NULL DEFAULT 1,
	`twitchVisibility` tinyint NOT NULL DEFAULT 1,
	CONSTRAINT `SocialInfo_id` PRIMARY KEY(`id`)
);
