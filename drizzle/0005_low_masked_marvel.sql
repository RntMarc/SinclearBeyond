CREATE TABLE `TravelAccommodation` (
	`ID` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255),
	`description` text,
	`address` text,
	`OSMID` bigint unsigned,
	`latitude` double,
	`longitude` double,
	`phone` varchar(100),
	`mail` varchar(191),
	`ishotel` tinyint NOT NULL,
	CONSTRAINT `TravelAccommodation_ID` PRIMARY KEY(`ID`)
);
--> statement-breakpoint
CREATE TABLE `TravelEventTicket` (
	`ID` int AUTO_INCREMENT NOT NULL,
	`type` enum('event','trip','user') NOT NULL,
	`event` int unsigned,
	`trip` int unsigned,
	`user` varchar(191),
	`qrcode` text,
	`image` text,
	CONSTRAINT `TravelEventTicket_ID` PRIMARY KEY(`ID`)
);
--> statement-breakpoint
CREATE TABLE `TravelEvent` (
	`ID` int AUTO_INCREMENT NOT NULL,
	`trip` int unsigned NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`start` datetime NOT NULL,
	`end` datetime NOT NULL,
	`hastickets` enum('1','0') DEFAULT '0',
	`ticket` int unsigned,
	`ticketUrl` text,
	`url` text,
	`image` text,
	`organizer` varchar(255),
	`address` text,
	`latitude` double,
	`longitude` double,
	`OSMID` bigint,
	CONSTRAINT `TravelEvent_ID` PRIMARY KEY(`ID`)
);
--> statement-breakpoint
CREATE TABLE `TravelRelation` (
	`ID` int AUTO_INCREMENT NOT NULL,
	`userid` varchar(191) NOT NULL,
	`tripid` int unsigned NOT NULL,
	`accommodation` int unsigned,
	CONSTRAINT `TravelRelation_ID` PRIMARY KEY(`ID`)
);
--> statement-breakpoint
CREATE TABLE `TravelTrip` (
	`ID` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`start` datetime NOT NULL,
	`end` datetime NOT NULL,
	`hastickets` enum('1','0') DEFAULT '0',
	`ticket` int unsigned,
	`ticketUrl` text,
	CONSTRAINT `TravelTrip_ID` PRIMARY KEY(`ID`)
);
