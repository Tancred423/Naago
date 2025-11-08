--> User Data

CREATE TABLE `character_data` (
	`character_id` int UNSIGNED NOT NULL,
	`latest_update` timestamp NOT NULL,
	`json_string` text NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `character_data_character_id` PRIMARY KEY(`character_id`)
);

CREATE TABLE `favorites` (
	`user_id` varchar(255) NOT NULL,
	`character_id` int UNSIGNED NOT NULL,
	`character_name` varchar(255) NOT NULL,
	`server` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `favorites_user_id_character_id` PRIMARY KEY(`user_id`,`character_id`)
);

CREATE TABLE `verifications` (
	`user_id` varchar(255) NOT NULL,
	`character_id` int UNSIGNED NOT NULL,
	`verification_code` varchar(255) NOT NULL,
	`is_verified` boolean NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `verifications_user_id` PRIMARY KEY(`user_id`)
);

CREATE TABLE `profile_pages` (
	`user_id` varchar(255) NOT NULL,
	`profile_page` varchar(100) NOT NULL,
	`sub_profile_page` varchar(100) NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `profile_pages_user_id` PRIMARY KEY(`user_id`)
);

CREATE TABLE `themes` (
	`user_id` varchar(255) NOT NULL,
	`theme` varchar(100) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `themes_user_id` PRIMARY KEY(`user_id`)
);

--> Guild Data

CREATE TABLE `setups` (
	`guild_id` varchar(255) NOT NULL,
	`type` varchar(100) NOT NULL,
	`channel_id` varchar(255) NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `setups_guild_id_type` PRIMARY KEY(`guild_id`,`type`)
);

--> Lodestone News

CREATE TABLE `topic_data` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` text NOT NULL,
	`link` text NOT NULL,
	`date` timestamp NOT NULL,
	`banner` text NOT NULL,
	`description` text NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `topic_data_id` PRIMARY KEY(`id`)
);

CREATE TABLE `notice_data` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tag` varchar(255) NULL,
	`title` text NOT NULL,
	`date` timestamp NOT NULL,
	`link` text NOT NULL,
	`description` text NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notice_data_id` PRIMARY KEY(`id`)
);

CREATE TABLE `maintenance_data` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tag` varchar(255) NULL,
	`title` text NOT NULL,
	`date` timestamp NOT NULL,
	`link` text NOT NULL,
	`description` text NOT NULL,
	`start_date` timestamp NULL,
	`end_date` timestamp NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `maintenance_data_id` PRIMARY KEY(`id`)
);

CREATE TABLE `update_data` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` text NOT NULL,
	`date` timestamp NOT NULL,
	`link` text NOT NULL,
	`description` text NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `update_data_id` PRIMARY KEY(`id`)
);

CREATE TABLE `status_data` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tag` varchar(255) NULL,
	`title` text NOT NULL,
	`date` timestamp NOT NULL,
	`link` text NOT NULL,
	`description` text NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `status_data_id` PRIMARY KEY(`id`)
);

--> Indexes

CREATE INDEX `idx_favorites_character` ON `favorites` (`character_id`);
CREATE INDEX `idx_verifications_character` ON `verifications` (`character_id`);
CREATE INDEX `idx_verifications_status` ON `verifications` (`is_verified`);
CREATE INDEX `idx_maintenance_date` ON `maintenance_data` (`date`);
CREATE INDEX `idx_maintenance_period` ON `maintenance_data` (`start_date`,`end_date`);
CREATE INDEX `idx_notice_date` ON `notice_data` (`date`);
CREATE INDEX `idx_status_date` ON `status_data` (`date`);
CREATE INDEX `idx_topic_date` ON `topic_data` (`date`);
CREATE INDEX `idx_update_date` ON `update_data` (`date`);
CREATE INDEX `idx_setups_guild` ON `setups` (`guild_id`);
