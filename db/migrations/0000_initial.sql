CREATE TABLE `character_data` (
	`character_id` varchar(255) NOT NULL,
	`latest_update` timestamp,
	`json_string` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `character_data_character_id` PRIMARY KEY(`character_id`)
);
--> statement-breakpoint
CREATE TABLE `favorites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` varchar(255) NOT NULL,
	`character_id` varchar(255) NOT NULL,
	`character_name` varchar(255),
	`server` varchar(255),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `favorites_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_favorite` UNIQUE(`user_id`,`character_id`)
);
--> statement-breakpoint
CREATE TABLE `verifications` (
	`user_id` varchar(255) NOT NULL,
	`character_id` varchar(255) NOT NULL,
	`verification_code` varchar(255),
	`is_verified` boolean DEFAULT false,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `verifications_user_id` PRIMARY KEY(`user_id`)
);
--> statement-breakpoint
CREATE TABLE `profile_pages` (
	`user_id` varchar(255) NOT NULL,
	`profile_page` varchar(100) DEFAULT 'profile',
	`sub_profile_page` varchar(100),
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `profile_pages_user_id` PRIMARY KEY(`user_id`)
);
--> statement-breakpoint
CREATE TABLE `themes` (
	`user_id` varchar(255) NOT NULL,
	`theme` varchar(100) DEFAULT 'dark',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `themes_user_id` PRIMARY KEY(`user_id`)
);
--> statement-breakpoint
CREATE TABLE `maintenance_data` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` text NOT NULL,
	`tag` varchar(255),
	`date` timestamp NOT NULL,
	`link` text,
	`details` text,
	`m_from` timestamp,
	`m_to` timestamp,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `maintenance_data_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notice_data` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` text NOT NULL,
	`tag` varchar(255),
	`date` timestamp NOT NULL,
	`link` text,
	`details` text,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `notice_data_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `status_data` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` text NOT NULL,
	`tag` varchar(255),
	`date` timestamp NOT NULL,
	`link` text,
	`details` text,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `status_data_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `topic_data` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` text NOT NULL,
	`date` timestamp NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `topic_data_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `update_data` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` text NOT NULL,
	`date` timestamp NOT NULL,
	`link` text,
	`details` text,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `update_data_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `setups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`guild_id` varchar(255) NOT NULL,
	`type` varchar(100) NOT NULL,
	`channel_id` varchar(255) NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `setups_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_setup` UNIQUE(`guild_id`,`type`)
);
--> statement-breakpoint
CREATE TABLE `social_medias` (
	`id` int AUTO_INCREMENT NOT NULL,
	`character_id` varchar(255) NOT NULL,
	`platform` varchar(255),
	`url` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `social_medias_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_user` ON `favorites` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_date` ON `maintenance_data` (`date`);--> statement-breakpoint
CREATE INDEX `idx_maintenance_period` ON `maintenance_data` (`m_from`,`m_to`);--> statement-breakpoint
CREATE INDEX `idx_date` ON `notice_data` (`date`);--> statement-breakpoint
CREATE INDEX `idx_date` ON `status_data` (`date`);--> statement-breakpoint
CREATE INDEX `idx_date` ON `topic_data` (`date`);--> statement-breakpoint
CREATE INDEX `idx_date` ON `update_data` (`date`);--> statement-breakpoint
CREATE INDEX `idx_guild` ON `setups` (`guild_id`);--> statement-breakpoint
CREATE INDEX `idx_type` ON `setups` (`type`);--> statement-breakpoint
CREATE INDEX `idx_character` ON `social_medias` (`character_id`);

