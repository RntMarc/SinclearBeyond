CREATE TABLE `Passkey` (
	`id` varchar(191) NOT NULL,
	`userId` varchar(191) NOT NULL,
	`name` varchar(191) NOT NULL,
	`credentialId` text NOT NULL,
	`publicKey` text NOT NULL,
	`counter` bigint NOT NULL DEFAULT 0,
	`transports` text,
	`createdAt` datetime(3) NOT NULL,
	`lastUsedAt` datetime(3),
	CONSTRAINT `Passkey_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `WebauthnChallenge` (
	`id` varchar(191) NOT NULL,
	`challenge` varchar(191) NOT NULL,
	`userId` varchar(191),
	`expiresAt` datetime(3) NOT NULL,
	`createdAt` datetime(3) NOT NULL,
	CONSTRAINT `WebauthnChallenge_id` PRIMARY KEY(`id`)
);
